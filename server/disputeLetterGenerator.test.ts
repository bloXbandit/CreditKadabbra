import { describe, it, expect } from 'vitest';
import { generateDisputeLetter, generateDisputeLetterFromReport } from './disputeLetterGenerator';

describe('Dispute Letter Generator', () => {
  const mockUserInfo = {
    name: 'John Doe',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    ssn: '123-45-6789',
    dateOfBirth: '01/15/1985',
  };

  const mockItems = [
    {
      type: 'account' as const,
      description: 'Capital One Credit Card',
      accountNumber: '1234',
      creditorName: 'Capital One',
      reason: 'The payment status is inaccurate. I made all payments on time.',
    },
  ];

  describe('generateDisputeLetter', () => {
    it('should generate an inaccuracy dispute letter', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'transunion',
        items: mockItems,
        letterType: 'inaccuracy',
      });

      expect(letter).toContain('John Doe');
      expect(letter).toContain('123 Main Street');
      expect(letter).toContain('New York, NY 10001');
      expect(letter).toContain('TransUnion LLC');
      expect(letter).toContain('Capital One Credit Card');
      expect(letter).toContain('Fair Credit Reporting Act');
      expect(letter).toContain('FCRA');
      expect(letter).toContain('30 days');
    });

    it('should generate a validation letter', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'equifax',
        items: mockItems,
        letterType: 'validation',
      });

      expect(letter).toContain('John Doe');
      expect(letter).toContain('Equifax Information Services LLC');
      expect(letter).toContain('Request for Verification');
      expect(letter).toContain('verification');
    });

    it('should generate a goodwill letter', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'experian',
        items: mockItems,
        letterType: 'goodwill',
      });

      expect(letter).toContain('John Doe');
      expect(letter).toContain('goodwill');
      expect(letter).toContain('Capital One');
    });

    it('should generate an identity theft letter', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'transunion',
        items: mockItems,
        letterType: 'identity_theft',
      });

      expect(letter).toContain('John Doe');
      expect(letter).toContain('Identity Theft');
      expect(letter).toContain('fraudulent');
      expect(letter).toContain('4 business days');
    });

    it('should generate a mixed file letter', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'equifax',
        items: mockItems,
        letterType: 'mixed_file',
      });

      expect(letter).toContain('John Doe');
      expect(letter).toContain('Mixed File');
      expect(letter).toContain('does not belong to me');
    });

    it('should include SSN last 4 digits only', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'transunion',
        items: mockItems,
        letterType: 'inaccuracy',
      });

      expect(letter).toContain('XXX-XX-6789');
      expect(letter).not.toContain('123-45-6789');
    });

    it('should include date of birth if provided', () => {
      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'transunion',
        items: mockItems,
        letterType: 'inaccuracy',
      });

      expect(letter).toContain('Date of Birth: 01/15/1985');
    });

    it('should handle multiple items', () => {
      const multipleItems = [
        ...mockItems,
        {
          type: 'inquiry' as const,
          description: 'Unauthorized inquiry from XYZ Bank',
          reason: 'I did not authorize this inquiry',
        },
      ];

      const letter = generateDisputeLetter({
        userInfo: mockUserInfo,
        bureau: 'transunion',
        items: multipleItems,
        letterType: 'inaccuracy',
      });

      expect(letter).toContain('1. Capital One Credit Card');
      expect(letter).toContain('2. Unauthorized inquiry from XYZ Bank');
    });
  });

  describe('generateDisputeLetterFromReport', () => {
    const mockNegativeAccounts = [
      {
        accountName: 'Chase Credit Card',
        accountNumber: '5678',
        paymentStatus: 'Charge-off',
        isNegative: true,
      },
      {
        accountName: 'Wells Fargo Auto Loan',
        accountNumber: '9012',
        paymentStatus: '30 days late',
        isNegative: true,
      },
    ];

    it('should generate letter from report negative items', () => {
      const letter = generateDisputeLetterFromReport(
        mockUserInfo,
        'transunion',
        mockNegativeAccounts,
        'inaccuracy'
      );

      expect(letter).toContain('John Doe');
      expect(letter).toContain('Chase Credit Card');
      expect(letter).toContain('Wells Fargo Auto Loan');
      expect(letter).toContain('5678');
      expect(letter).toContain('9012');
    });

    it('should filter only negative accounts', () => {
      const mixedAccounts = [
        ...mockNegativeAccounts,
        {
          accountName: 'Amex Card',
          accountNumber: '3456',
          paymentStatus: 'Current',
          isNegative: false,
        },
      ];

      const letter = generateDisputeLetterFromReport(
        mockUserInfo,
        'equifax',
        mixedAccounts,
        'inaccuracy'
      );

      expect(letter).toContain('Chase Credit Card');
      expect(letter).toContain('Wells Fargo Auto Loan');
      expect(letter).not.toContain('Amex Card');
    });

    it('should use default letter type if not specified', () => {
      const letter = generateDisputeLetterFromReport(
        mockUserInfo,
        'experian',
        mockNegativeAccounts
      );

      expect(letter).toContain('Formal Dispute of Inaccurate Information');
    });
  });
});
