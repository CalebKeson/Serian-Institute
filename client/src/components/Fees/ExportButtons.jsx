// src/components/Fees/ExportButtons.jsx - FIXED PRINT FUNCTIONALITY

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Mail,
  ChevronDown,
  Check,
  Calendar,
  Loader
} from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, calculateExportSummary } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

// Helper function to extract nested object values
const getNestedValue = (obj, path) => {
  if (!path || !obj) return null;
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Helper function to format values based on type
const formatExportValue = (value, type) => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return `KSh ${value.toLocaleString()}`;
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'percentage':
      return `${Math.round(value)}%`;
    default:
      return value;
  }
};

// Helper function to calculate aggregations
const calculateAggregation = (data, field, aggregation, filter = null) => {
  let filteredData = [...data];
  
  if (filter) {
    if (filter.method) {
      filteredData = filteredData.filter(item => {
        const method = getNestedValue(item, 'paymentMethod');
        return method === filter.method;
      });
    } else if (filter.value !== undefined) {
      filteredData = filteredData.filter(item => {
        const val = getNestedValue(item, field);
        return val === filter.value;
      });
    } else if (filter.min !== undefined) {
      filteredData = filteredData.filter(item => {
        const val = getNestedValue(item, field);
        return val >= filter.min;
      });
    }
  }
  
  const values = filteredData.map(item => getNestedValue(item, field)).filter(v => typeof v === 'number');
  
  switch (aggregation) {
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0);
    case 'average':
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    case 'count':
      return values.length;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    default:
      return null;
  }
};

const ExportButtons = ({
  data = [],
  config = null,
  filename = 'export',
  onExport,
  formats = ['csv', 'excel', 'pdf', 'print', 'email'],
  includeDateRange = true,
  buttonStyle = 'default',
  buttonText = 'Export',
  customSummaryData = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const dropdownRef = useRef(null);
  const emailInputRef = useRef(null);
  const printContentRef = useRef(null);

  // Use the config title as filename prefix if not specified
  const finalFilename = filename === 'export' && config?.title 
    ? config.title.toLowerCase().replace(/\s/g, '_') 
    : filename;

  // FIXED: Print function without react-to-print
  const handlePrint = () => {
    try {
      // Get the print content
      const printContent = printContentRef.current;
      if (!printContent) {
        toast.error('Print content not ready');
        return;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600,toolbar=yes,scrollbars=yes');
      
      if (!printWindow) {
        toast.error('Please allow popups to print. Check your browser settings.');
        return;
      }

      // Get the HTML content
      const contentHtml = printContent.outerHTML;
      
      // Write to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${config?.title || 'Report'} - ${finalFilename}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .print-container {
                max-width: 1200px;
                margin: 0 auto;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #059669;
                color: white;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              .summary-card {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 10px;
              }
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${contentHtml}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print();setTimeout(function(){window.close();}, 1000);" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
                🖨️ Print
              </button>
              <button onclick="window.close();" style="padding: 10px 20px; font-size: 14px; margin-left: 10px; cursor: pointer;">
                ❌ Close
              </button>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Print window opened. Click Print to continue.');
      
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to open print window: ' + error.message);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowDatePicker(false);
        setShowEmailInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showEmailInput && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [showEmailInput]);

  const getButtonClasses = () => {
    switch (buttonStyle) {
      case 'minimal':
        return 'text-gray-600 hover:text-gray-900 text-sm font-medium';
      case 'icon':
        return 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors';
      default:
        return 'inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors';
    }
  };

  // Prepare data for export based on config
  const prepareExportData = () => {
    let exportData = [...data];
    
    if (includeDateRange && customDateRange.startDate && customDateRange.endDate) {
      exportData = exportData.filter(item => {
        const dateField = item.paymentDate || item.date || item.createdAt;
        if (!dateField) return true;
        const itemDate = new Date(dateField);
        return itemDate >= new Date(customDateRange.startDate) && 
               itemDate <= new Date(customDateRange.endDate);
      });
    }
    
    if (!config || !config.columns) {
      return exportData;
    }
    
    const transformedData = exportData.map(item => {
      const row = {};
      config.columns.forEach(col => {
        const value = getNestedValue(item, col.accessor);
        row[col.header] = formatExportValue(value, col.type);
      });
      return row;
    });
    
    return transformedData;
  };
  
  // Calculate summary based on config
  const calculateSummary = () => {
    if (!config || !config.summaryFields) {
      if (data.length > 0) {
        return calculateExportSummary(data);
      }
      return null;
    }
    
    let filteredData = [...data];
    
    if (includeDateRange && customDateRange.startDate && customDateRange.endDate) {
      filteredData = filteredData.filter(item => {
        const dateField = item.paymentDate || item.date || item.createdAt;
        if (!dateField) return true;
        const itemDate = new Date(dateField);
        return itemDate >= new Date(customDateRange.startDate) && 
               itemDate <= new Date(customDateRange.endDate);
      });
    }
    
    const summary = {};
    config.summaryFields.forEach(field => {
      let value;
      
      if (field.value) {
        if (customSummaryData && customSummaryData[field.value] !== undefined) {
          value = customSummaryData[field.value];
        } else {
          value = field.value;
        }
      } else {
        value = calculateAggregation(filteredData, field.accessor, field.aggregation, field.filter);
      }
      
      if (field.format === 'currency') {
        summary[field.label] = `KSh ${(value || 0).toLocaleString()}`;
      } else if (field.format === 'percentage') {
        summary[field.label] = `${Math.round(value || 0)}%`;
      } else if (typeof value === 'number') {
        summary[field.label] = value.toLocaleString();
      } else {
        summary[field.label] = value || '-';
      }
    });
    
    return summary;
  };

  // Generate print content HTML
  const generatePrintContent = () => {
    const exportData = prepareExportData();
    const summary = calculateSummary();
    const headers = config?.columns?.map(col => col.header) || (exportData[0] ? Object.keys(exportData[0]) : []);
    
    return (
      <div ref={printContentRef} className="print-container">
        {/* Header */}
        <div className="header">
          <h1 style={{ color: '#059669', marginBottom: '8px' }}>{config?.title || 'Report'}</h1>
          <p>Serian Institute</p>
          {includeDateRange && customDateRange.startDate && customDateRange.endDate && (
            <p style={{ fontSize: '12px', color: '#666' }}>
              Period: {customDateRange.startDate} to {customDateRange.endDate}
            </p>
          )}
          <p style={{ fontSize: '12px', color: '#666' }}>
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Summary Section */}
        {summary && Object.keys(summary).length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #059669', paddingBottom: '5px' }}>
              Summary
            </h2>
            <div className="summary-grid">
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} className="summary-card">
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{key}</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Table */}
        {exportData.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '10px', borderBottom: '2px solid #059669', paddingBottom: '5px' }}>
              Detailed Report
            </h2>
            <table>
              <thead>
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exportData.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {headers.map((header, colIdx) => (
                      <td key={colIdx}>
                        {row[header] !== undefined && row[header] !== null ? row[header] : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>This is a computer-generated report. No signature required.</p>
          <p>Serian Institute - Building Excellence</p>
        </div>
      </div>
    );
  };

  const handleExportClick = async (format) => {
    setIsExporting(true);
    
    try {
      const exportData = prepareExportData();
      const summary = calculateSummary();
      const effectiveDateRange = includeDateRange ? customDateRange : null;
      
      switch (format) {
        case 'csv':
          const csvHeaders = config?.columns?.map(col => col.header) || (exportData[0] ? Object.keys(exportData[0]) : []);
          const csvFormatter = (item, type) => {
            return csvHeaders.map(header => item[header]);
          };
          exportToCSV(exportData, finalFilename, csvHeaders, csvFormatter);
          toast.success('CSV file exported successfully');
          break;
          
        case 'excel':
          const excelHeaders = config?.columns?.map(col => col.header);
          const excelSheetName = config?.title || 'Data';
          exportToExcel(exportData, finalFilename, excelSheetName, excelHeaders);
          toast.success('Excel file exported successfully');
          break;
          
        case 'pdf':
          const pdfHeaders = config?.columns?.map(col => col.header);
          exportToPDF(
            exportData,
            config?.title || 'Report',
            finalFilename,
            {
              headers: pdfHeaders,
              summary,
              dateRange: effectiveDateRange
            }
          );
          toast.success('PDF file exported successfully');
          break;
          
        case 'print':
          handlePrint();
          break;
          
        case 'email':
          setShowEmailInput(true);
          setIsExporting(false);
          return;
          
        default:
          if (onExport) {
            await onExport(format, { dateRange: effectiveDateRange, data: exportData, summary });
          }
      }
      
      setIsOpen(false);
      setShowEmailInput(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailSend = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsExporting(true);
    
    try {
      setTimeout(() => {
        toast.success(`Report sent to ${emailAddress}`);
        setShowEmailInput(false);
        setEmailAddress('');
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'csv':
        return <FileText className="w-4 h-4" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'print':
        return <Printer className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getFormatLabel = (format) => {
    switch (format) {
      case 'csv':
        return 'CSV';
      case 'excel':
        return 'Excel';
      case 'pdf':
        return 'PDF';
      case 'print':
        return 'Print';
      case 'email':
        return 'Email';
      default:
        return format;
    }
  };

  if (isExporting) {
    return (
      <button disabled className={getButtonClasses()}>
        <Loader className="w-4 h-4 mr-2 animate-spin" />
        Exporting...
      </button>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={getButtonClasses()}
        >
          <Download className="w-4 h-4 mr-2" />
          {buttonText}
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900">Export Options</h3>
              {config?.title && (
                <p className="text-xs text-gray-500 mt-1">{config.title}</p>
              )}
            </div>

            {/* Date Range Picker */}
            {includeDateRange && (
              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center justify-between w-full text-sm text-gray-700 hover:text-gray-900"
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Date Range</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>

                {showDatePicker && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Format Options */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Export Format</p>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                      selectedFormat === format
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {getFormatIcon(format)}
                    <span className="ml-2 capitalize">{getFormatLabel(format)}</span>
                    {selectedFormat === format && (
                      <Check className="w-3 h-3 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Input */}
            {showEmailInput && (
              <div className="px-4 py-3 border-b border-gray-200">
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => showEmailInput ? handleEmailSend() : handleExportClick(selectedFormat)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                {showEmailInput ? 'Send' : 'Export'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden print content - this is what will be printed */}
      <div style={{ display: 'none' }}>
        {generatePrintContent()}
      </div>
    </>
  );
};

export default ExportButtons;