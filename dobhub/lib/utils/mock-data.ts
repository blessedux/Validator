import { Certificate } from '@/lib/api/api-client'

export const mockCertificates: Certificate[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    deviceName: "Solar Panel Array Alpha",
    deviceType: "Solar Panel",
    location: "California, USA", // General region only
    serialNumber: "SP-2024-001",
    manufacturer: "Tesla",
    model: "Solar Roof v3.5",
    yearOfManufacture: "2024",
    condition: "Excellent",
    specifications: "High-efficiency solar panels with integrated battery storage. 400W peak output per panel. Weather-resistant design with 25-year warranty.",
    purchasePrice: 0, // Remove financial info
    currentValue: 0, // Remove financial info
    expectedRevenue: 0, // Remove financial info
    operationalCosts: 0, // Remove financial info
    status: "APPROVED",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    user: {
      id: "user-001",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    files: [
      {
        id: "file-001",
        filename: "installation-certificate.pdf",
        path: "/files/installation-certificate.pdf",
        size: 2048576,
        mimeType: "application/pdf",
        documentType: "certificate"
      },
      {
        id: "file-002",
        filename: "technical-specs.pdf",
        path: "/files/technical-specs.pdf",
        size: 1048576,
        mimeType: "application/pdf",
        documentType: "specification"
      }
    ],
    reviews: [
      {
        id: "review-001",
        notes: "Excellent installation quality and documentation. All safety standards met.",
        technicalScore: 95,
        regulatoryScore: 98,
        financialScore: 92,
        environmentalScore: 96,
        overallScore: 95.25,
        decision: "APPROVED",
        createdAt: "2024-01-15T12:00:00Z"
      }
    ],
    // Add blockchain verification data
    blockchainData: {
      transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      blockNumber: 18945672,
      network: "stellar",
      stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    // Add certification level and risk assessment
    certification: {
      level: "GOLD",
      riskLevel: "LOW",
      trufaScore: 95.25,
      validationCriteria: [
        "Technical Specifications Verified",
        "Safety Standards Compliance",
        "Environmental Impact Assessment",
        "Regulatory Compliance",
        "Quality Assurance Documentation"
      ],
      certifiedBy: "DOB Protocol Validator Network",
      certificationDate: "2024-01-15T12:00:00Z"
    }
  },
  {
    id: "456e7890-e89b-12d3-a456-426614174001",
    deviceName: "Wind Turbine Beta",
    deviceType: "Wind Turbine",
    location: "Texas, USA", // General region only
    serialNumber: "WT-2024-002",
    manufacturer: "General Electric",
    model: "GE 2.5-120",
    yearOfManufacture: "2024",
    condition: "Good",
    specifications: "2.5 MW wind turbine with 120m rotor diameter. Advanced control systems for optimal power generation. Low maintenance design.",
    purchasePrice: 0,
    currentValue: 0,
    expectedRevenue: 0,
    operationalCosts: 0,
    status: "APPROVED",
    createdAt: "2024-01-20T14:15:00Z",
    updatedAt: "2024-01-20T14:15:00Z",
    user: {
      id: "user-002",
      walletAddress: "0x8f3d35Cc6634C0532925a3b8D4C0532925a3b8D5",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    files: [
      {
        id: "file-003",
        filename: "wind-turbine-cert.pdf",
        path: "/files/wind-turbine-cert.pdf",
        size: 3072000,
        mimeType: "application/pdf",
        documentType: "certificate"
      }
    ],
    reviews: [
      {
        id: "review-002",
        notes: "Solid engineering and compliance. Minor documentation improvements needed.",
        technicalScore: 88,
        regulatoryScore: 92,
        financialScore: 90,
        environmentalScore: 94,
        overallScore: 91.0,
        decision: "APPROVED",
        createdAt: "2024-01-20T16:30:00Z"
      }
    ],
    blockchainData: {
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      blockNumber: 18945675,
      network: "stellar",
      stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    },
    certification: {
      level: "SILVER",
      riskLevel: "MEDIUM",
      trufaScore: 91.0,
      validationCriteria: [
        "Engineering Standards Compliance",
        "Wind Resource Assessment",
        "Grid Integration Verification",
        "Environmental Impact Review",
        "Operational Safety Validation"
      ],
      certifiedBy: "DOB Protocol Validator Network",
      certificationDate: "2024-01-20T16:30:00Z"
    }
  },
  {
    id: "789e0123-e89b-12d3-a456-426614174002",
    deviceName: "Battery Storage Gamma",
    deviceType: "Battery Storage",
    location: "Florida, USA", // General region only
    serialNumber: "BS-2024-003",
    manufacturer: "Tesla",
    model: "Powerwall 3",
    yearOfManufacture: "2024",
    condition: "Excellent",
    specifications: "13.5 kWh lithium-ion battery with integrated inverter. 10-year warranty. Grid-tied and off-grid capable.",
    purchasePrice: 0,
    currentValue: 0,
    expectedRevenue: 0,
    operationalCosts: 0,
    status: "APPROVED",
    createdAt: "2024-01-25T09:45:00Z",
    updatedAt: "2024-01-25T09:45:00Z",
    user: {
      id: "user-003",
      walletAddress: "0x9a4e35Cc6634C0532925a3b8D4C0532925a3b8D6",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    files: [
      {
        id: "file-004",
        filename: "battery-cert.pdf",
        path: "/files/battery-cert.pdf",
        size: 1536000,
        mimeType: "application/pdf",
        documentType: "certificate"
      }
    ],
    reviews: [
      {
        id: "review-003",
        notes: "Outstanding performance and safety features. Exceeds industry standards.",
        technicalScore: 97,
        regulatoryScore: 95,
        financialScore: 93,
        environmentalScore: 96,
        overallScore: 95.25,
        decision: "APPROVED",
        createdAt: "2024-01-25T11:20:00Z"
      }
    ],
    blockchainData: {
      transactionHash: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      blockNumber: 18945678,
      network: "stellar",
      stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"
    },
    certification: {
      level: "PLATINUM",
      riskLevel: "VERY_LOW",
      trufaScore: 95.25,
      validationCriteria: [
        "Battery Safety Standards",
        "Performance Testing Verification",
        "Grid Compatibility Assessment",
        "Cybersecurity Validation",
        "Warranty Compliance Review"
      ],
      certifiedBy: "DOB Protocol Validator Network",
      certificationDate: "2024-01-25T11:20:00Z"
    }
  },
  {
    id: "012e3456-e89b-12d3-a456-426614174003",
    deviceName: "Smart Grid Transformer Delta",
    deviceType: "Grid Equipment",
    location: "Washington, USA", // General region only
    serialNumber: "GT-2024-004",
    manufacturer: "Siemens",
    model: "Smart Transformer X1",
    yearOfManufacture: "2024",
    condition: "Good",
    specifications: "Smart grid transformer with IoT monitoring. 1000 kVA capacity. Real-time monitoring and predictive maintenance.",
    purchasePrice: 0,
    currentValue: 0,
    expectedRevenue: 0,
    operationalCosts: 0,
    status: "APPROVED",
    createdAt: "2024-02-01T13:20:00Z",
    updatedAt: "2024-02-01T13:20:00Z",
    user: {
      id: "user-004",
      walletAddress: "0x7b5f35Cc6634C0532925a3b8D4C0532925a3b8D7",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    },
    files: [
      {
        id: "file-005",
        filename: "transformer-cert.pdf",
        path: "/files/transformer-cert.pdf",
        size: 2560000,
        mimeType: "application/pdf",
        documentType: "certificate"
      }
    ],
    reviews: [
      {
        id: "review-004",
        notes: "Advanced technology implementation. Excellent grid integration capabilities.",
        technicalScore: 94,
        regulatoryScore: 96,
        financialScore: 89,
        environmentalScore: 92,
        overallScore: 92.75,
        decision: "APPROVED",
        createdAt: "2024-02-01T15:45:00Z"
      }
    ],
    blockchainData: {
      transactionHash: "0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      blockNumber: 18945681,
      network: "stellar",
      stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd"
    },
    certification: {
      level: "GOLD",
      riskLevel: "LOW",
      trufaScore: 92.75,
      validationCriteria: [
        "Grid Integration Standards",
        "IoT Security Assessment",
        "Predictive Maintenance Validation",
        "Load Management Verification",
        "Reliability Testing"
      ],
      certifiedBy: "DOB Protocol Validator Network",
      certificationDate: "2024-02-01T15:45:00Z"
    }
  },
  {
    id: "345e6789-e89b-12d3-a456-426614174004",
    deviceName: "Smart Meter Network Epsilon",
    deviceType: "Smart Meter",
    location: "Colorado, USA", // General region only
    serialNumber: "SM-2024-005",
    manufacturer: "ABB",
    model: "Smart Meter Pro",
    yearOfManufacture: "2024",
    condition: "Excellent",
    specifications: "Advanced metering infrastructure with two-way communication. Real-time consumption monitoring. Tamper detection.",
    purchasePrice: 0,
    currentValue: 0,
    expectedRevenue: 0,
    operationalCosts: 0,
    status: "APPROVED",
    createdAt: "2024-02-05T08:30:00Z",
    updatedAt: "2024-02-05T08:30:00Z",
    user: {
      id: "user-005",
      walletAddress: "0x6c8d35Cc6634C0532925a3b8D4C0532925a3b8D8",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    files: [
      {
        id: "file-006",
        filename: "smart-meter-cert.pdf",
        path: "/files/smart-meter-cert.pdf",
        size: 1024000,
        mimeType: "application/pdf",
        documentType: "certificate"
      }
    ],
    reviews: [
      {
        id: "review-005",
        notes: "Excellent data accuracy and communication reliability. Industry leading technology.",
        technicalScore: 96,
        regulatoryScore: 94,
        financialScore: 91,
        environmentalScore: 93,
        overallScore: 93.5,
        decision: "APPROVED",
        createdAt: "2024-02-05T10:15:00Z"
      }
    ],
    blockchainData: {
      transactionHash: "0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      blockNumber: 18945684,
      network: "stellar",
      stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"
    },
    certification: {
      level: "SILVER",
      riskLevel: "MEDIUM",
      trufaScore: 93.5,
      validationCriteria: [
        "Data Accuracy Verification",
        "Communication Protocol Testing",
        "Privacy Protection Assessment",
        "Tamper Detection Validation",
        "Regulatory Compliance Review"
      ],
      certifiedBy: "DOB Protocol Validator Network",
      certificationDate: "2024-02-05T10:15:00Z"
    }
  },
  {
    id: "678e9012-e89b-12d3-a456-426614174005",
    deviceName: "EV Charging Station Zeta",
    deviceType: "EV Charger",
    location: "Oregon, USA", // General region only
    serialNumber: "EV-2024-006",
    manufacturer: "Tesla",
    model: "Supercharger V4",
    yearOfManufacture: "2024",
    condition: "Excellent",
    specifications: "250 kW DC fast charger with CCS and Tesla connectors. Payment integration and mobile app support.",
    purchasePrice: 0,
    currentValue: 0,
    expectedRevenue: 0,
    operationalCosts: 0,
    status: "APPROVED",
    createdAt: "2024-02-10T11:45:00Z",
    updatedAt: "2024-02-10T11:45:00Z",
    user: {
      id: "user-006",
      walletAddress: "0x5d9e35Cc6634C0532925a3b8D4C0532925a3b8D9",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    files: [
      {
        id: "file-007",
        filename: "ev-charger-cert.pdf",
        path: "/files/ev-charger-cert.pdf",
        size: 1792000,
        mimeType: "application/pdf",
        documentType: "certificate"
      }
    ],
    reviews: [
      {
        id: "review-006",
        notes: "Fast charging capabilities and excellent user experience. Well-integrated payment system.",
        technicalScore: 93,
        regulatoryScore: 95,
        financialScore: 88,
        environmentalScore: 97,
        overallScore: 93.25,
        decision: "APPROVED",
        createdAt: "2024-02-10T14:20:00Z"
      }
    ],
    blockchainData: {
      transactionHash: "0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
      blockNumber: 18945687,
      network: "stellar",
      stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd"
    },
    certification: {
      level: "GOLD",
      riskLevel: "LOW",
      trufaScore: 93.25,
      validationCriteria: [
        "Charging Speed Verification",
        "Safety Standards Compliance",
        "Payment System Security",
        "User Interface Testing",
        "Environmental Impact Assessment"
      ],
      certifiedBy: "DOB Protocol Validator Network",
      certificationDate: "2024-02-10T14:20:00Z"
    }
  }
]

export const mockSearchResponse = {
  success: true,
  certificates: mockCertificates,
  total: mockCertificates.length,
  limit: 12,
  offset: 0,
  hasMore: false
}

export const mockCertificateResponse = {
  success: true,
  certificate: mockCertificates[0]
}

export const mockVerificationResponse = {
  success: true,
  isValid: true,
  certificate: mockCertificates[0],
  message: "Certificate is verified and active. It was validated on January 15, 2024."
} 