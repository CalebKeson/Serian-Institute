// src/utils/exportUtils.js

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} headers - Custom headers (optional)
 * @param {Function} formatter - Custom formatter function (optional)
 */
export const exportToCSV = (data, filename, headers = null, formatter = null) => {
  try {
    let exportData = data;
    let exportHeaders = headers;
    
    // Apply custom formatter if provided
    if (formatter && typeof formatter === 'function') {
      exportData = data.map(item => formatter(item, 'csv'));
      if (!exportHeaders && exportData.length > 0) {
        exportHeaders = Object.keys(exportData[0]);
      }
    }
    
    // Prepare headers
    const finalHeaders = exportHeaders || (exportData.length > 0 ? Object.keys(exportData[0]) : []);
    
    // Prepare data rows
    const rows = exportData.map(item => {
      if (Array.isArray(item)) {
        return item;
      }
      return finalHeaders.map(header => {
        let value = item[header];
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
    });
    
    // Build CSV content
    let csvContent = finalHeaders.join(',') + '\n';
    csvContent += rows.map(row => row.join(',')).join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('CSV Export error:', error);
    throw error;
  }
};

// In src/utils/exportUtils.js - Replace the exportToExcel function with this

/**
 * Export data to Excel file (XLSX)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet (will be truncated to 31 chars)
 * @param {Array} headers - Custom headers (optional)
 * @param {Function} formatter - Custom formatter function (optional)
 */
export const exportToExcel = (data, filename, sheetName = 'Data', headers = null, formatter = null) => {
  try {
    let worksheetData = [];
    
    // Truncate sheet name to maximum 31 characters (Excel limit)
    let safeSheetName = sheetName.substring(0, 31);
    // Remove any invalid characters from sheet name
    safeSheetName = safeSheetName.replace(/[\\/*?:\[\]]/g, '');
    
    // Apply custom formatter if provided
    let exportData = data;
    if (formatter && typeof formatter === 'function') {
      exportData = data.map(item => formatter(item, 'excel'));
    }
    
    // Prepare headers
    const finalHeaders = headers || (exportData.length > 0 ? Object.keys(exportData[0]) : []);
    
    // Build worksheet data array
    if (finalHeaders.length > 0) {
      worksheetData.push(finalHeaders);
    }
    
    // Add data rows
    exportData.forEach(item => {
      const row = [];
      finalHeaders.forEach(header => {
        let value = item[header];
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        row.push(value);
      });
      worksheetData.push(row);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-size columns
    const colWidths = [];
    worksheetData[0]?.forEach((_, idx) => {
      let maxLength = 0;
      worksheetData.forEach(row => {
        const cellValue = row[idx]?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      colWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
    worksheet['!cols'] = colWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    
    // Generate Excel file
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel Export error:', error);
    throw error;
  }
};

/**
 * Export data to PDF file
 * @param {Array} data - Array of objects to export
 * @param {string} title - Title of the report
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Additional options (headers, summary, dateRange)
 */
export const exportToPDF = (data, title, filename, options = {}) => {
  try {
    const { headers, summary, dateRange, columns } = options;
    
    // Initialize PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // Green color
    doc.text(title, 14, 20);
    
    // Add institution name
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Serian Institute', 14, 30);
    
    // Add date range if provided
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      let dateText = 'Period: ';
      if (dateRange.startDate) dateText += `${dateRange.startDate} to `;
      if (dateRange.endDate) dateText += dateRange.endDate;
      doc.text(dateText, 14, 38);
    }
    
    // Add generation date
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 46);
    
    // Add summary section if provided
    let yOffset = 55;
    if (summary && Object.keys(summary).length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', 14, yOffset);
      yOffset += 6;
      
      const summaryKeys = Object.keys(summary);
      const summaryPerRow = 4;
      const summaryWidth = 45;
      let startX = 14;
      
      summaryKeys.forEach((key, index) => {
        const xPos = startX + (index % summaryPerRow) * summaryWidth;
        const yPos = yOffset + Math.floor(index / summaryPerRow) * 12;
        
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(key.replace(/([A-Z])/g, ' $1').trim(), xPos, yPos);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        let value = summary[key];
        if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
          value = `KSh ${value.toLocaleString()}`;
        } else if (typeof value === 'number') {
          value = value.toLocaleString();
        }
        doc.text(value.toString(), xPos, yPos + 6);
      });
      
      yOffset += Math.ceil(summaryKeys.length / summaryPerRow) * 12 + 10;
    }
    
    // Prepare table data
    let tableHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
    let tableData = data;
    
    // Apply custom column mapping if provided
    if (columns && Array.isArray(columns)) {
      tableHeaders = columns.map(col => col.header);
      tableData = data.map(row => {
        return columns.map(col => {
          let value = row[col.accessor];
          if (col.format === 'currency' && typeof value === 'number') {
            return `KSh ${value.toLocaleString()}`;
          }
          if (col.format === 'date' && value) {
            return new Date(value).toLocaleDateString();
          }
          return value || '-';
        });
      });
    } else {
      // Format data for table
      tableData = data.map(item => {
        return tableHeaders.map(header => {
          let value = item[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          if (typeof value === 'number' && (header.toLowerCase().includes('amount') || header.toLowerCase().includes('fee') || header.toLowerCase().includes('paid'))) {
            return `KSh ${value.toLocaleString()}`;
          }
          if (header.toLowerCase().includes('date') && value) {
            return new Date(value).toLocaleDateString();
          }
          return value || '-';
        });
      });
    }
    
    // Add table to PDF
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yOffset,
      margin: { top: 10, left: 14, right: 14 },
      theme: 'striped',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 'auto' }
      },
      styles: {
        overflow: 'linebreak',
        valign: 'middle'
      },
      didDrawPage: (data) => {
        // Add footer on each page
        const pageCount = doc.getNumberOfPages();
        const currentPage = data.pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${currentPage} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });
    
    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF Export error:', error);
    throw error;
  }
};

/**
 * Calculate summary statistics from data
 * @param {Array} data - Array of objects
 * @returns {Object} Summary statistics
 */
export const calculateExportSummary = (data) => {
  if (!data || data.length === 0) {
    return { totalRecords: 0 };
  }
  
  const summary = {
    totalRecords: data.length
  };
  
  // Find amount fields
  const amountFields = [];
  const sampleItem = data[0];
  if (sampleItem && typeof sampleItem === 'object') {
    Object.keys(sampleItem).forEach(key => {
      if (key.toLowerCase().includes('amount') || 
          key.toLowerCase().includes('fee') || 
          key.toLowerCase().includes('price') ||
          key.toLowerCase().includes('paid') ||
          key.toLowerCase().includes('balance')) {
        amountFields.push(key);
      }
    });
  }
  
  // Calculate totals for amount fields
  amountFields.forEach(field => {
    const total = data.reduce((sum, item) => {
      const value = item[field] || 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    summary[`total${field.charAt(0).toUpperCase() + field.slice(1)}`] = total;
    summary[`average${field.charAt(0).toUpperCase() + field.slice(1)}`] = total / (data.length || 1);
  });
  
  return summary;
};

// Export all functions as default object as well
const exportUtils = {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  calculateExportSummary
};

export default exportUtils;