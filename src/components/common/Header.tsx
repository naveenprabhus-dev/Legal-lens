import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  Scale,
  LogOut,
  FolderKanban,
  GitCompare,
  FileSignature,
  LayoutDashboard,
  ChevronDown,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import { Workspace } from '../../types';

interface HeaderProps {
  user: User;
  onSignOut: () => void;
  activeView: 'dashboard' | 'workspace' | 'compare' | 'briefs';
  onNavigate: (view: 'dashboard' | 'workspace' | 'compare' | 'briefs') => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  onSelectWorkspace: (id: string) => void;
  onOpenNewWorkspaceModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignOut,
  activeView,
  onNavigate,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onOpenNewWorkspaceModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWorkspaceDropdown(false);
        setShowUserMenu(false);
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(e.target as Node)
      ) {
        setShowWorkspaceDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 w-full">
      {/* Accessible Skip Navigation Link */}
      <a href="#main-content" className="skip-to-content-link">
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Workspace Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="header-home-btn"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 rounded-lg p-1 shrink-0 text-left"
            aria-label="Legal Lens - Return to Dashboard"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs" aria-hidden="true">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-serif text-lg sm:text-xl font-bold text-slate-900 truncate">
              Legal Lens
            </span>
          </button>

          {/* Workspace Switcher */}
          {workspaces.length > 0 && (
            <div className="relative shrink-0" ref={workspaceDropdownRef}>
              <button
                id="workspace-switcher-btn"
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                aria-haspopup="menu"
                aria-expanded={showWorkspaceDropdown}
                aria-controls="workspace-dropdown-menu"
                aria-label={`Current workspace: ${activeWorkspace ? activeWorkspace.name : 'None selected'}. Click to switch.`}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
              >
                <FolderKanban className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate font-medium">
                  {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
              </button>

              {showWorkspaceDropdown && (
                <div
                  id="workspace-dropdown-menu"
                  role="menu"
                  aria-label="Workspaces list"
                  className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-40"
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    My Workspaces
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        role="menuitem"
                        onClick={() => {
                          onSelectWorkspace(ws.id);
                          onNavigate('workspace');
                          setShowWorkspaceDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-hidden focus:bg-indigo-50/70 ${
                          activeWorkspace?.id === ws.id
                            ? 'font-semibold text-indigo-700 bg-indigo-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {ws.documentCount || 0} doc
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-1.5 mt-1 border-t border-slate-100 px-1">
                    <button
                      id="dropdown-new-workspace-btn"
                      role="menuitem"
                      onClick={() => {
                        setShowWorkspaceDropdown(false);
                        onOpenNewWorkspaceModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-indigo-700 hover:bg-indigo-50/80 flex items-center gap-1.5 focus:outline-hidden focus:bg-indigo-50"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>New Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Main Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          <button
            id="nav-dashboard-btn"
            onClick={() => onNavigate('dashboard')}
            aria-current={activeView === 'dashboard' ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 ${
              activeView === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-workspace-btn"
            onClick={() => onNavigate('workspace')}
            disabled={!activeWorkspace}
            aria-current={activeView === 'workspace' ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 ${
              activeView === 'workspace'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Workspace</span>
          </button>

          <button
            id="nav-compare-btn"
            onClick={() => onNavigate('compare')}
            aria-current={activeView === 'compare' ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 ${
              activeView === 'compare'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compare</span>
          </button>

          <button
            id="nav-briefs-btn"
            onClick={() => onNavigate('briefs')}
            aria-current={activeView === 'briefs' ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 ${
              activeView === 'briefs'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Preparation Briefs</span>
          </button>
        </nav>

        {/* Right: User Profile & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative" ref={userMenuRef}>
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              aria-controls="user-profile-menu"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
              aria-label={`User menu for ${user.displayName || user.email}`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center border border-indigo-200" aria-hidden="true">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-medium text-slate-800 leading-tight max-w-[120px] truncate">
                  {user.displayName || 'User'}
                </div>
                <div className="text-[10px] text-slate-600 leading-tight max-w-[120px] truncate">
                  {user.email}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 hidden sm:block" aria-hidden="true" />
            </button>

            {showUserMenu && (
              <div
                id="user-profile-menu"
                role="menu"
                aria-label="User account options"
                className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">
                    {user.displayName || 'Signed In'}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">{user.email}</p>
                  <p className="text-[10px] text-slate-600 mt-1 font-mono">UID: {user.uid.substring(0, 8)}...</p>
                </div>

                <div className="p-1">
                  <button
                    id="sign-out-btn"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-2 transition-colors focus:outline-hidden focus:bg-rose-50"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Navigation Toggle Button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
            aria-label={mobileMenuOpen ? 'Close mobile navigation menu' : 'Open mobile navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation-menu"
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg"
        >
          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            aria-current={activeView === 'dashboard' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              activeView === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              onNavigate('workspace');
              setMobileMenuOpen(false);
            }}
            disabled={!activeWorkspace}
            aria-current={activeView === 'workspace' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              activeView === 'workspace'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 disabled:opacity-40'
            }`}
          >
            <FolderKanban className="w-4 h-4" aria-hidden="true" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => {
              onNavigate('compare');
              setMobileMenuOpen(false);
            }}
            aria-current={activeView === 'compare' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              activeView === 'compare'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GitCompare className="w-4 h-4" aria-hidden="true" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => {
              onNavigate('briefs');
              setMobileMenuOpen(false);
            }}
            aria-current={activeView === 'briefs' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              activeView === 'briefs'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileSignature className="w-4 h-4" aria-hidden="true" />
            <span>Preparation Briefs</span>
          </button>
        </nav>
      )}
    </header>
  );
};
