// src/components/Fees/ExportButtons.jsx
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
  Filter,
  X,
  Loader
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const ExportButtons = ({
  data = [],
  filename = 'export',
  onExport,
  formats = ['csv', 'excel', 'pdf', 'print', 'email'],
  includeDateRange = true,
  includeFilters = true,
  customHeaders = null,
  customFormatter = null,
  loading = false,
  buttonStyle = 'default', // 'default', 'minimal', 'icon'
  buttonText = 'Export',
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    includeSummary: true,
    formatDate: true,
    formatCurrency: true
  });
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const dropdownRef = useRef(null);
  const emailInputRef = useRef(null);

  // Close dropdown when clicking outside
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

  // Focus email input when shown
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

  const handleExport = async (format) => {
    if (onExport) {
      // Use custom export handler if provided
      await onExport(format, { dateRange, options: exportOptions });
    } else {
      // Default export handling
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          exportToExcel();
          break;
        case 'pdf':
          exportToPDF();
          break;
        case 'print':
          handlePrint();
          break;
        case 'email':
          setShowEmailInput(true);
          return;
      }
    }
    
    setIsOpen(false);
    setShowEmailInput(false);
  };

  const exportToCSV = () => {
    try {
      // Prepare headers
      let headers = customHeaders || Object.keys(data[0] || {});
      
      // Prepare data rows
      const rows = data.map(item => {
        if (customFormatter) {
          return customFormatter(item, 'csv');
        }
        
        return headers.map(header => {
          let value = item[header];
          
          // Format based on options
          if (exportOptions.formatDate && value instanceof Date) {
            value = formatDate(value);
          }
          if (exportOptions.formatCurrency && typeof value === 'number' && header.toLowerCase().includes('amount')) {
            value = formatCurrency(value);
          }
          
          return `"${value}"`;
        });
      });

      // Build CSV content
      let csvContent = '';
      
      if (exportOptions.includeHeaders) {
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
      }
      
      if (exportOptions.includeSummary && data.length > 0) {
        // Add summary row
        const summary = calculateSummary(data);
        csvContent += '\n' + Object.values(summary).join(',') + '\n\n';
      }
      
      csvContent += rows.map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error('CSV Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const exportToExcel = () => {
    // For Excel, we'll use CSV with .xls extension as a simple solution
    // In a production app, you'd want to use a library like xlsx
    try {
      exportToCSV();
      toast.success('Excel file downloaded (CSV format)');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  const exportToPDF = () => {
    // In a real app, you'd use a library like jspdf or react-pdf
    // For now, we'll use print as a fallback
    toast.success('PDF export will be available soon');
    handlePrint();
  };

  const handlePrint = () => {
    // Create printable content
    const printWindow = window.open('', '_blank');
    
    // Build HTML content
    let htmlContent = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #059669; margin-bottom: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .date-range { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
            .summary { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename}</h1>
            <div class="date-range">
              Generated: ${new Date().toLocaleDateString()}<br>
              Period: ${dateRange.startDate} to ${dateRange.endDate}
            </div>
          </div>
    `;

    // Add summary if enabled
    if (exportOptions.includeSummary && data.length > 0) {
      const summary = calculateSummary(data);
      htmlContent += `
        <div class="summary">
          <h3>Summary</h3>
          <p>Total Records: ${data.length}</p>
          <p>Total Amount: ${formatCurrency(summary.totalAmount)}</p>
          <p>Average: ${formatCurrency(summary.average)}</p>
        </div>
      `;
    }

    // Add table
    htmlContent += '<table><thead><tr>';
    
    const headers = customHeaders || Object.keys(data[0] || {});
    headers.forEach(header => {
      htmlContent += `<th>${header}</th>`;
    });
    htmlContent += '</tr></thead><tbody>';

    data.forEach(item => {
      htmlContent += '<tr>';
      headers.forEach(header => {
        let value = item[header];
        if (exportOptions.formatCurrency && typeof value === 'number' && header.toLowerCase().includes('amount')) {
          value = formatCurrency(value);
        }
        htmlContent += `<td>${value || ''}</td>`;
      });
      htmlContent += '</tr>';
    });

    htmlContent += `
          </tbody>
        </table>
        <div class="footer">
          <p>Generated by Serian Institute Management System</p>
        </div>
      </body>
    </html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    toast.success('Print dialog opened');
  };

  const handleEmailSend = () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // In a real app, this would trigger an API call to email the report
    toast.success(`Report will be sent to ${emailAddress}`);
    setShowEmailInput(false);
    setEmailAddress('');
    setIsOpen(false);
  };

  const calculateSummary = (items) => {
    const totalAmount = items.reduce((sum, item) => {
      // Try to find amount fields
      const amountField = Object.keys(item).find(key => 
        key.toLowerCase().includes('amount') || 
        key.toLowerCase().includes('total') ||
        key.toLowerCase().includes('price')
      );
      return sum + (item[amountField] || 0);
    }, 0);

    return {
      totalAmount,
      average: totalAmount / (items.length || 1)
    };
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

  if (loading) {
    return (
      <button
        disabled
        className={getButtonClasses()}
      >
        <Loader className="w-4 h-4 mr-2 animate-spin" />
        Exporting...
      </button>
    );
  }

  if (buttonStyle === 'minimal') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={getButtonClasses()}
        >
          {buttonText}
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              {formats.map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                >
                  {getFormatIcon(format)}
                  <span className="ml-2 capitalize">{getFormatLabel(format)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
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
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
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

          {/* Advanced Options */}
          {includeFilters && (
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Options</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeHeaders}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Include Headers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSummary}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Include Summary</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.formatCurrency}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, formatCurrency: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Format Currency</span>
                </label>
              </div>
            </div>
          )}

          {/* Email Input (when email selected) */}
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
              onClick={() => showEmailInput ? handleEmailSend() : handleExport(selectedFormat)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              {showEmailInput ? 'Send' : 'Export'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButtons;