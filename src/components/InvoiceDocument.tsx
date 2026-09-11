import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #4f46e5',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    color: '#3730a3',
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 12,
  },
  table: {
    marginTop: 20,
    borderTop: '1px solid #e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    paddingVertical: 10,
  },
  tableHeader: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 11,
    color: '#0f172a',
  },
  col1: { width: '40%' },
  col2: { width: '30%' },
  col3: { width: '30%', textAlign: 'right' },
  totalSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  }
});

interface InvoiceProps {
  type: 'INVOICE' | 'RECEIPT';
  invoiceNumber: string;
  date: string;
  studentName: string;
  parentName: string;
  period: string;
  amount: number;
  description: string;
  paymentInstructions?: string;
}

export const InvoiceDocument = ({
  type,
  invoiceNumber,
  date,
  studentName,
  parentName,
  period,
  amount,
  description,
  paymentInstructions,
}: InvoiceProps) => {
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{type === 'INVOICE' ? 'INVOICE (TAGIHAN)' : 'KUITANSI PEMBAYARAN'}</Text>
          </View>
          <View>
            <Text style={styles.meta}>No: {invoiceNumber}</Text>
            <Text style={styles.meta}>Tanggal: {date}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Ditagihkan kepada:</Text>
            <Text style={styles.value}>{parentName}</Text>
            <Text style={styles.label}>Nama Siswa:</Text>
            <Text style={styles.value}>{studentName}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Periode Les:</Text>
            <Text style={styles.value}>{period}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.col1}><Text style={styles.tableHeader}>Deskripsi</Text></View>
            <View style={styles.col2}><Text style={styles.tableHeader}>Periode</Text></View>
            <View style={styles.col3}><Text style={styles.tableHeader}>Jumlah</Text></View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={styles.col1}><Text style={styles.tableCell}>{description}</Text></View>
            <View style={styles.col2}><Text style={styles.tableCell}>{period}</Text></View>
            <View style={styles.col3}><Text style={styles.tableCell}>{formatRupiah(amount)}</Text></View>
          </View>
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatRupiah(amount)}</Text>
        </View>

        {type === 'INVOICE' && paymentInstructions && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.label}>Instruksi Pembayaran:</Text>
            <Text style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>
              {paymentInstructions}
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Dihasilkan secara otomatis oleh sistem LesKita. Pembayaran dilakukan langsung kepada guru.
        </Text>
      </Page>
    </Document>
  );
};
