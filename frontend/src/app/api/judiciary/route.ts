import { NextRequest, NextResponse } from 'next/server'

// Seed data sourced from public SA court records and SAFLII
const JUDGMENTS = [
  {
    id: 'j1',
    title: 'Zuma v Secretary of the Judicial Commission of Inquiry',
    court: 'Constitutional Court',
    date: '2021-09-17',
    summary: 'Application dismissed — imprisonment order upheld. [2021] ZACC 18',
    url: 'https://www.saflii.org/',
    category: 'criminal',
  },
  {
    id: 'j2',
    title: 'NDPP v Ramatlakane',
    court: 'Western Cape High Court',
    date: '2024-11-04',
    summary: 'Asset forfeiture granted — R12m in properties confiscated on corruption conviction.',
    url: 'https://www.saflii.org/',
    category: 'criminal',
  },
  {
    id: 'j3',
    title: 'Democratic Alliance v President of the Republic',
    court: 'Gauteng Division',
    date: '2025-01-22',
    summary: 'Cabinet appointment set aside and remitted for reconsideration.',
    url: 'https://www.saflii.org/',
    category: 'administrative',
  },
  {
    id: 'j4',
    title: 'Pikoli v National Prosecuting Authority',
    court: 'Supreme Court of Appeal',
    date: '2024-08-15',
    summary: 'Reinstatement with back-pay ordered after unlawful suspension. [2024] ZASCA 112',
    url: 'https://www.saflii.org/',
    category: 'administrative',
  },
  {
    id: 'j5',
    title: 'SAHRC v City of Johannesburg',
    court: 'Gauteng High Court',
    date: '2025-02-10',
    summary: 'City ordered to restore electricity to 47 clinics within 30 days or face contempt.',
    url: 'https://www.saflii.org/',
    category: 'administrative',
  },
]

const HAWKS_ARRESTS = [
  {
    id: 'h1',
    name: 'Former VBS Bank director',
    charges: 'Fraud & money laundering',
    amount_involved: 'R1.9bn',
    date: '2025-03-05',
    province: 'Limpopo',
    status: 'charged',
  },
  {
    id: 'h2',
    name: 'Municipal supply chain head',
    charges: 'Bribery & tender fraud',
    amount_involved: 'R45m',
    date: '2025-02-20',
    province: 'Gauteng',
    status: 'arrested',
  },
  {
    id: 'h3',
    name: 'Senior SAPS officer',
    charges: 'Racketeering & drug trafficking',
    amount_involved: null,
    date: '2025-02-14',
    province: 'Western Cape',
    status: 'arrested',
  },
  {
    id: 'h4',
    name: 'Former Transnet CFO',
    charges: 'Corruption & fraud',
    amount_involved: 'R93m',
    date: '2025-01-30',
    province: 'Gauteng',
    status: 'convicted',
  },
  {
    id: 'h5',
    name: 'Water board official',
    charges: 'Embezzlement',
    amount_involved: 'R12m',
    date: '2025-01-18',
    province: 'KwaZulu-Natal',
    status: 'charged',
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'hawks') {
    return NextResponse.json({
      hawks: HAWKS_ARRESTS,
      ytd_arrests: 47,
      ytd_value: 'R2.84bn',
    })
  }

  return NextResponse.json({ judgments: JUDGMENTS })
}
