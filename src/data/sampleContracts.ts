/**
 * High-quality, grounded sample contracts for immediate evaluation and exploration.
 * Enables evaluators to test Legal Lens instantly without having to supply external PDF files.
 */

export interface SampleContract {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  fileSize: number;
  text: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'sample-commercial-lease',
    name: 'Standard_Commercial_Lease_Agreement.pdf',
    type: 'Commercial Lease',
    category: 'Real Estate & Facility',
    description: 'Triple-net office suite lease featuring operating expenses, 60-day renewal notice, and security deposit terms.',
    fileSize: 184320, // ~180 KB
    text: `COMMERCIAL REAL ESTATE LEASE AGREEMENT

This Commercial Lease Agreement (the "Lease") is entered into as of October 1, 2024, by and between APEX METRO PROPERTIES LLC ("Landlord"), a Delaware limited liability company having its principal office at 450 Lexington Avenue, New York, NY, and NIMBLE TECH LABS INC. ("Tenant"), a Delaware corporation having its principal place of business at 100 Main Street, Suite 400.

SECTION 1. DEMISED PREMISES AND TERM
1.1 Demised Premises: Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, Suite 400 (the "Premises"), comprising approximately 4,500 rentable square feet located on the fourth (4th) floor of the office building located at 500 Market Plaza, Austin, TX 78701.
1.2 Term: The initial term of this Lease shall be thirty-six (36) full calendar months, commencing on November 1, 2024 (the "Commencement Date") and expiring on October 31, 2027 (the "Expiration Date"), unless sooner terminated in accordance with the provisions herein.
1.3 Option to Renew: Tenant shall have the option to renew this Lease for one (1) additional term of twenty-four (24) months, provided Tenant delivers written non-renewal or renewal notice to Landlord not less than sixty (60) days prior to the Expiration Date. Failure to deliver written notice shall forfeit Tenant's renewal option.

SECTION 2. BASE RENT AND OPERATING EXPENSES
2.1 Base Rent: Tenant agrees to pay Landlord Base Rent in the amount of Twelve Thousand Five Hundred Dollars ($12,500.00) per month, payable on or before the first (1st) day of each calendar month.
2.2 Late Fee: Any installment of Base Rent or Additional Rent not received by Landlord within five (5) business days after the due date shall incur a late charge equal to five percent (5%) of the overdue amount plus interest at 1.5% per month.
2.3 Security Deposit: Concurrently with execution, Tenant shall deposit with Landlord the sum of Twenty-Five Thousand Dollars ($25,000.00) as security for full and faithful performance of Tenant's obligations.
2.4 Operating Expense Escalation (Triple Net): Tenant shall pay Tenant's Proportionate Share (18.5%) of Operating Expenses and Real Estate Taxes exceeding the Base Year 2024.

SECTION 3. USE, ALTERATIONS, AND REPAIRS
3.1 Permitted Use: General commercial executive office and software development use only.
3.2 Alterations: Tenant shall not make any alterations, additions, or improvements without prior written approval from Landlord. Any non-removable improvements shall immediately become property of Landlord.
3.3 Maintenance: Landlord shall maintain the structural foundations, exterior roof, and common HVAC equipment. Tenant shall maintain the interior non-structural components and interior lighting fixtures at Tenant's sole expense.

SECTION 4. INDEMNIFICATION AND INSURANCE
4.1 Tenant Indemnification: Tenant shall defend, indemnify, and hold harmless Landlord, its agents, and employees against any and all liabilities, losses, claims, damages, and expenses (including reasonable attorney's fees) arising out of or resulting from Tenant's use or occupancy of the Premises, except to the extent caused by gross negligence or willful misconduct of Landlord.
4.2 Insurance Requirements: Tenant shall maintain Commercial General Liability Insurance with limits of not less than $2,000,000 per occurrence and $4,000,000 in the aggregate, naming Landlord as an additional insured.

SECTION 5. TERMINATION AND DEFAULT
5.1 Event of Default: Any failure to pay rent within ten (10) days of written notice, or failure to cure a non-monetary default within thirty (30) days, constitutes an Event of Default.
5.2 Landlord Remedies: Upon default, Landlord may terminate this Lease, re-enter the Premises, accelerate remaining rent payments discounted to present value, and recover all costs of re-letting including legal fees.
5.3 Notice Requirements: All formal legal notices must be delivered via certified mail with return receipt requested or nationally recognized overnight courier to the addresses stated in the Preamble.

SECTION 6. GOVERNING LAW AND DISPUTE RESOLUTION
6.1 Governing Law: This Lease shall be governed and construed in accordance with the laws of the State of Texas without regard to conflict of law principles.
6.2 Venue: Exclusive jurisdiction and venue for any judicial proceedings shall lie in the state and federal courts located in Travis County, Texas. Both parties mutually waive trial by jury.`
  },
  {
    id: 'sample-mutual-nda',
    name: 'Bilateral_Mutual_NDA_Agreement.pdf',
    type: 'Non-Disclosure Agreement',
    category: 'Corporate & IP',
    description: 'Mutual non-disclosure covenant covering confidential technical data, 3-year term, and mandatory return protocols.',
    fileSize: 112640, // ~110 KB
    text: `MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is made and entered into as of January 15, 2025 (the "Effective Date"), by and between VANGUARD SYSTEMS CORP., a California corporation ("Disclosing Party" and "Receiving Party"), and HORIZON VENTURES PARTNERS LLC, a Delaware limited liability company ("Disclosing Party" and "Receiving Party").

1. PURPOSE
The parties wish to explore a potential strategic commercial and investment partnership (the "Purpose"). In connection with the Purpose, each party may disclose to the other certain non-public, proprietary, or confidential information.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any proprietary information, technical data, trade secrets, know-how, software architectures, financial forecasts, customer lists, and business strategies disclosed by either party, whether orally or in writing, that is marked as confidential or that reasonably should be understood to be confidential given the nature of the information.

3. OBLIGATIONS OF RECEIVING PARTY
3.1 Duty of Care: The Receiving Party shall hold and maintain the Disclosing Party's Confidential Information in strict confidence, applying at least the same degree of care as it uses for its own confidential information of like importance, but in no event less than reasonable care.
3.2 Use Restriction: The Receiving Party shall use Confidential Information solely in furtherance of evaluating and pursuing the Purpose.
3.3 Permitted Disclosures: The Receiving Party may disclose Confidential Information only to its officers, directors, employees, and legal advisors who have a need to know such information for the Purpose and who are bound by written confidentiality obligations at least as restrictive as those herein.

4. EXCLUSIONS FROM CONFIDENTIALITY
Confidential Information does not include information that:
(a) is or becomes publicly known through no breach of this Agreement;
(b) was already in the Receiving Party's rightful possession without restriction prior to disclosure;
(c) is independently developed by the Receiving Party without reference to or reliance upon Disclosing Party's Confidential Information;
(d) is received rightfully from a third party without duty of confidentiality.

5. TERM AND RETURN OF MATERIALS
5.1 Term: This Agreement shall remain in effect for a period of two (2) years from the Effective Date. The confidentiality and non-use obligations under Section 3 shall survive expiration or termination for an additional period of three (3) years.
5.2 Return or Destruction: Within fourteen (14) calendar days following written request by Disclosing Party, Receiving Party shall promptly return or certify in writing the permanent destruction of all physical and electronic copies of Confidential Information.

6. REMEDIES AND INJUNCTIVE RELIEF
The parties acknowledge that unauthorized disclosure or use of Confidential Information will cause irreparable injury for which monetary damages alone would be inadequate. Accordingly, Disclosing Party shall be entitled to seek injunctive relief without posting bond or proving actual monetary damages, in addition to all other legal remedies.

7. MISCELLANEOUS
7.1 Governing Law: This Agreement shall be governed by the laws of the State of California.
7.2 Entire Agreement: This Agreement constitutes the entire agreement between the parties concerning its subject matter and supersedes all prior discussions.`
  },
  {
    id: 'sample-freelance-services',
    name: 'Master_Consulting_Services_Contract.pdf',
    type: 'Service Agreement',
    category: 'Consulting & Freelance',
    description: 'Master service agreement with Net 30 payment, IP assignment upon full payment, and 14-day termination for convenience.',
    fileSize: 143360, // ~140 KB
    text: `MASTER CONSULTING SERVICES AGREEMENT

This Master Consulting Services Agreement (the "Agreement") is dated February 1, 2025, between ACME ENTERPRISE CORP. ("Client"), a New York corporation, and CREATIVE STRATEGY LABS LLC ("Consultant"), an independent contractor having its principal address in Brooklyn, NY.

1. SERVICES AND STATEMENTS OF WORK
Consultant agrees to provide professional consulting and software design services described in one or more mutually executed Statements of Work ("SOW"). Each SOW shall detail the deliverables, schedule, and compensation.

2. COMPENSATION AND EXPENSES
2.1 Fees: Client shall compensate Consultant at the agreed rate of $150.00 per hour, not to exceed $15,000 per monthly milestone without prior written approval.
2.2 Invoicing and Payment Terms: Consultant shall submit bi-weekly invoices. Client shall pay all undisputed invoice amounts within thirty (30) calendar days of receipt ("Net 30").
2.3 Late Payments: Invoices unpaid after forty-five (45) days shall accrue interest at 1.0% per month or the maximum legal rate.

3. INTELLECTUAL PROPERTY RIGHTS
3.1 Work for Hire Condition: Consultant agrees that all deliverables created specifically for Client under this Agreement shall constitute "works made for hire."
3.2 Contingency of IP Assignment: Ownership and copyright of deliverables shall transfer and vest in Client ONLY UPON FULL PAYMENT of all invoices related to such deliverables. Until full payment is received, Consultant retains all rights and licenses.
3.3 Pre-existing Tools: Consultant retains sole ownership of all pre-existing software frameworks, generic libraries, and proprietary design methodologies utilized during the engagement.

4. TERM AND TERMINATION
4.1 Term: This Agreement commences on February 1, 2025, and continues until terminated.
4.2 Termination for Convenience: Either party may terminate this Agreement or any active SOW at any time with or without cause upon fourteen (14) days' written notice to the other party. Client shall pay Consultant for all work completed and expenses incurred up to the effective termination date.
4.3 Termination for Cause: Either party may terminate immediately if the other party breaches a material term and fails to cure such breach within seven (7) days of written notice.

5. LIMITATION OF LIABILITY
Neither party shall be liable for indirect, incidental, consequential, or punitive damages. Consultant's total aggregate liability arising under this Agreement shall be limited to the total fees actually paid by Client to Consultant in the three (3) months preceding the incident.

6. GENERAL
6.1 Independent Contractor: Consultant is an independent contractor, not an employee, partner, or agent of Client.
6.2 Governing Law: This Agreement is governed by the laws of the State of New York.`
  }
];

export function createSamplePdfFile(sample: SampleContract): File {
  // Construct a text-encoded file with a PDF extension so the upload pipeline accepts and extracts it
  const blob = new Blob([sample.text], { type: 'application/pdf' });
  return new File([blob], sample.name, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}
