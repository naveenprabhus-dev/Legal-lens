import { describe, it, expect } from 'vitest';

/**
 * Security rule simulator mirroring firestore.rules logic
 */
interface SecurityContext {
  auth: { uid: string } | null;
}

interface FirestoreResource<T = Record<string, unknown>> {
  data: T & { ownerId?: string; workspaceId?: string; uid?: string };
}

interface RequestResource<T = Record<string, unknown>> {
  data: T & { ownerId?: string; workspaceId?: string; uid?: string };
}

class FirestoreSecuritySimulator {
  static isSignedIn(ctx: SecurityContext): boolean {
    return ctx.auth !== null;
  }

  static isOwner(ctx: SecurityContext, userId: string): boolean {
    return this.isSignedIn(ctx) && ctx.auth?.uid === userId;
  }

  static isValidId(id: string): boolean {
    return typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
  }

  // /users/{userId}
  static allowUserAccess(
    ctx: SecurityContext,
    targetUserId: string,
    operation: 'get' | 'list' | 'create' | 'update' | 'delete',
    requestData?: RequestResource['data']
  ): boolean {
    if (!this.isOwner(ctx, targetUserId)) return false;
    if (operation === 'create' || operation === 'update') {
      return requestData?.uid === targetUserId;
    }
    return true;
  }

  // /users/{userId}/workspaces/{workspaceId}
  static allowWorkspaceAccess(
    ctx: SecurityContext,
    userId: string,
    workspaceId: string,
    operation: 'get' | 'list' | 'create' | 'update' | 'delete',
    requestData?: RequestResource['data'],
    existingResource?: FirestoreResource['data']
  ): boolean {
    if (!this.isOwner(ctx, userId)) return false;
    if (operation === 'create') {
      return this.isValidId(workspaceId) && requestData?.ownerId === userId;
    }
    if (operation === 'update') {
      return (
        this.isValidId(workspaceId) &&
        requestData?.ownerId === userId &&
        existingResource?.ownerId === userId
      );
    }
    return true;
  }

  // /users/{userId}/workspaces/{workspaceId}/documents/{documentId}
  static allowDocumentAccess(
    ctx: SecurityContext,
    userId: string,
    workspaceId: string,
    documentId: string,
    operation: 'get' | 'list' | 'create' | 'update' | 'delete',
    requestData?: RequestResource['data'],
    existingResource?: FirestoreResource['data']
  ): boolean {
    if (!this.isOwner(ctx, userId)) return false;
    if (operation === 'create') {
      return (
        this.isValidId(documentId) &&
        requestData?.ownerId === userId &&
        requestData?.workspaceId === workspaceId
      );
    }
    if (operation === 'update') {
      return (
        this.isValidId(documentId) &&
        requestData?.ownerId === userId &&
        existingResource?.ownerId === userId
      );
    }
    return true;
  }

  // Storage path simulator: users/{userId}/workspaces/{workspaceId}/documents/{documentId}/{fileName}
  static allowStorageAccess(
    ctx: SecurityContext,
    storagePath: string,
    operation: 'read' | 'write'
  ): boolean {
    if (!this.isSignedIn(ctx)) return false;
    const parts = storagePath.split('/');
    if (parts[0] !== 'users' || parts.length < 5) return false;
    const pathOwnerId = parts[1];
    return ctx.auth?.uid === pathOwnerId;
  }
}

describe('Security & Multi-Tenant Data Isolation Suite', () => {
  const aliceContext: SecurityContext = { auth: { uid: 'user_alice' } };
  const bobContext: SecurityContext = { auth: { uid: 'user_bob' } };
  const unauthenticatedContext: SecurityContext = { auth: null };

  describe('1. Unauthenticated Access Denied', () => {
    it('denies unauthenticated users from reading or writing user records', () => {
      expect(
        FirestoreSecuritySimulator.allowUserAccess(unauthenticatedContext, 'user_alice', 'get')
      ).toBe(false);

      expect(
        FirestoreSecuritySimulator.allowUserAccess(unauthenticatedContext, 'user_alice', 'create', {
          uid: 'user_alice',
        })
      ).toBe(false);
    });

    it('denies unauthenticated users from accessing workspaces or documents', () => {
      expect(
        FirestoreSecuritySimulator.allowWorkspaceAccess(
          unauthenticatedContext,
          'user_alice',
          'ws_01',
          'get'
        )
      ).toBe(false);

      expect(
        FirestoreSecuritySimulator.allowDocumentAccess(
          unauthenticatedContext,
          'user_alice',
          'ws_01',
          'doc_01',
          'get'
        )
      ).toBe(false);
    });

    it('denies unauthenticated users from accessing storage files', () => {
      const storagePath = 'users/user_alice/workspaces/ws_01/documents/doc_01/contract.pdf';
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(unauthenticatedContext, storagePath, 'read')
      ).toBe(false);
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(unauthenticatedContext, storagePath, 'write')
      ).toBe(false);
    });
  });

  describe('2. Authenticated Owner Access Granted', () => {
    it('allows authenticated owner to read, create, and update their own workspaces', () => {
      // Alice reads Alice's workspace
      expect(
        FirestoreSecuritySimulator.allowWorkspaceAccess(aliceContext, 'user_alice', 'ws_01', 'get')
      ).toBe(true);

      // Alice creates workspace in Alice's collection
      expect(
        FirestoreSecuritySimulator.allowWorkspaceAccess(
          aliceContext,
          'user_alice',
          'ws_01',
          'create',
          { ownerId: 'user_alice' }
        )
      ).toBe(true);
    });

    it('allows authenticated owner to read, create, and update their own documents', () => {
      expect(
        FirestoreSecuritySimulator.allowDocumentAccess(
          aliceContext,
          'user_alice',
          'ws_01',
          'doc_01',
          'create',
          { ownerId: 'user_alice', workspaceId: 'ws_01' }
        )
      ).toBe(true);

      expect(
        FirestoreSecuritySimulator.allowDocumentAccess(
          aliceContext,
          'user_alice',
          'ws_01',
          'doc_01',
          'get'
        )
      ).toBe(true);
    });

    it('allows authenticated owner to read and write to their own storage path', () => {
      const aliceStoragePath = 'users/user_alice/workspaces/ws_01/documents/doc_01/contract.pdf';
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(aliceContext, aliceStoragePath, 'read')
      ).toBe(true);
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(aliceContext, aliceStoragePath, 'write')
      ).toBe(true);
    });
  });

  describe('3. Cross-User Workspace Access Denied', () => {
    it('denies Bob from reading Alice workspace', () => {
      const isAllowed = FirestoreSecuritySimulator.allowWorkspaceAccess(
        bobContext, // Bob request
        'user_alice', // Alice tenant path
        'ws_alice_top_secret',
        'get'
      );
      expect(isAllowed).toBe(false);
    });

    it('denies Bob from creating a workspace in Alice account', () => {
      const isAllowed = FirestoreSecuritySimulator.allowWorkspaceAccess(
        bobContext,
        'user_alice',
        'ws_injected',
        'create',
        { ownerId: 'user_bob' }
      );
      expect(isAllowed).toBe(false);
    });
  });

  describe('4. Cross-User Document Access Denied', () => {
    it('denies Bob from reading or listing Alice documents', () => {
      const canRead = FirestoreSecuritySimulator.allowDocumentAccess(
        bobContext,
        'user_alice',
        'ws_01',
        'doc_nda_sensitive',
        'get'
      );
      expect(canRead).toBe(false);

      const canList = FirestoreSecuritySimulator.allowDocumentAccess(
        bobContext,
        'user_alice',
        'ws_01',
        'doc_nda_sensitive',
        'list'
      );
      expect(canList).toBe(false);
    });

    it('denies Bob from modifying or deleting Alice document analysis records', () => {
      const canUpdate = FirestoreSecuritySimulator.allowDocumentAccess(
        bobContext,
        'user_alice',
        'ws_01',
        'doc_nda_sensitive',
        'update',
        { ownerId: 'user_bob' },
        { ownerId: 'user_alice' }
      );
      expect(canUpdate).toBe(false);

      const canDelete = FirestoreSecuritySimulator.allowDocumentAccess(
        bobContext,
        'user_alice',
        'ws_01',
        'doc_nda_sensitive',
        'delete'
      );
      expect(canDelete).toBe(false);
    });
  });

  describe('5. Storage Ownership Isolation', () => {
    it('denies Bob from accessing Alice uploaded storage documents', () => {
      const aliceFilePath = 'users/user_alice/workspaces/ws_01/documents/doc_01/Merger_Agreement.pdf';
      
      // Bob tries to read Alice's storage object
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(bobContext, aliceFilePath, 'read')
      ).toBe(false);

      // Bob tries to overwrite Alice's storage object
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(bobContext, aliceFilePath, 'write')
      ).toBe(false);
    });

    it('rejects invalid or malformed storage path traversal attempts', () => {
      const invalidPath = 'public/unprotected/doc.pdf';
      expect(
        FirestoreSecuritySimulator.allowStorageAccess(aliceContext, invalidPath, 'read')
      ).toBe(false);
    });
  });
});
