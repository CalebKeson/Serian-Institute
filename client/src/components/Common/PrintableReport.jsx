// src/components/Common/PrintableReport.jsx

import React, { forwardRef } from 'react';

const PrintableReport = forwardRef(({ 
  title, 
  data, 
  headers, 
  summary, 
  dateRange, 
  institutionName = 'Serian Institute' 
}, ref) => {
  // If no data, show message
  if (!data || data.length === 0) {
    return (
      <div ref={ref} className="print-container" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', color: '#059669' }}>{title}</h1>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>No data available for this report.</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="print-container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', color: '#059669', marginBottom: '8px' }}>{title}</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>{institutionName}</p>
        {dateRange && (dateRange.startDate || dateRange.endDate) && (
          <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
            Period: {dateRange.startDate || 'Start'} to {dateRange.endDate || 'End'}
          </p>
        )}
        <p style={{ fontSize: '12px', color: '#888' }}>
          Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Summary Section */}
      {summary && Object.keys(summary).length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '15px', 
            borderBottom: '2px solid #059669', 
            paddingBottom: '5px',
            color: '#374151'
          }}>
            Summary
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px' 
          }}>
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} style={{ 
                padding: '12px', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px', fontWeight: '500' }}>
                  {key}
                </p>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669', margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#059669', color: 'white' }}>
              {headers && headers.map((header, index) => (
                <th key={index} style={{ 
                  padding: '10px', 
                  textAlign: 'left', 
                  border: '1px solid #e5e7eb',
                  fontWeight: 'bold'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ 
                backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f9fafb'
              }}>
                {headers && headers.map((header, colIndex) => (
                  <td key={colIndex} style={{ 
                    padding: '8px', 
                    border: '1px solid #e5e7eb',
                    verticalAlign: 'top'
                  }}>
                    {row[header] !== undefined && row[header] !== null ? row[header] : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '30px', 
        fontSize: '10px', 
        color: '#9ca3af', 
        borderTop: '1px solid #e5e7eb', 
        paddingTop: '10px' 
      }}>
        <p style={{ margin: '5px 0' }}>This is a computer-generated report. No signature required.</p>
        <p style={{ margin: '5px 0' }}>Serian Institute - Building Excellence</p>
      </div>
    </div>
  );
});

PrintableReport.displayName = 'PrintableReport';

export default PrintableReport;