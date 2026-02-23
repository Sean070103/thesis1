'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Plus, Search, FileText, Loader2, ChevronDown, Check, X, Filter, 
  Calendar, ArrowUpDown, ArrowUp, ArrowDown, Download,
  Eye, Edit3, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Package, Clock, BarChart3, List, History
} from 'lucide-react';
import { 
  getTransactionsFromSupabase, 
  saveTransactionToSupabase, 
  getMaterialsFromSupabase,
  updateMaterialQuantity,
  deleteTransactionFromSupabase,
  updateTransactionInSupabase,
  generateId 
} from '@/lib/supabase-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialTransaction, Material } from '@/types';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';

// ============================================
// CUSTOM DROPDOWN COMPONENT
// ============================================
interface DropdownOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
}

function CustomDropdown({ options, value, onChange, placeholder = 'Select...', searchable = false }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && search
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase()) ||
        opt.subLabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 rounded-xl text-left transition-all duration-300 flex items-center justify-between
          ${isOpen 
            ? 'bg-slate-800 border-amber-500/50 ring-2 ring-amber-500/20' 
            : 'bg-gradient-to-r from-slate-800/60 to-slate-900/60 border-slate-700/50 hover:border-slate-600/50'
          }
          border backdrop-blur-sm`}
      >
        <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-2xl shadow-black/50 animate-fade-in border border-slate-700/50"
          style={{ 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {searchable && (
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between group
                    ${option.value === value 
                      ? 'bg-amber-500/10 border-l-2 border-amber-500' 
                      : 'hover:bg-slate-800/50 border-l-2 border-transparent hover:border-slate-600'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${option.value === value ? 'text-amber-400' : 'text-white group-hover:text-amber-400'}`}>
                      {option.label}
                    </p>
                    {option.subLabel && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{option.subLabel}</p>
                    )}
                  </div>
                  {option.value === value && (
                    <Check size={16} className="text-amber-400 shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// DATE RANGE PICKER COMPONENT
// ============================================
type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  customStart?: string;
  customEnd?: string;
  onCustomChange?: (start: string, end: string) => void;
}

function DateRangePicker({ value, onChange, customStart, customEnd, onCustomChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const ranges: { key: DateRange; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ranges.map((range) => (
        <button
          key={range.key}
          onClick={() => {
            onChange(range.key);
            if (range.key === 'custom') setShowCustom(true);
            else setShowCustom(false);
          }}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
            value === range.key
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
              : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30'
          }`}
        >
          {range.label}
        </button>
      ))}
      
      {(value === 'custom' || showCustom) && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomChange?.(e.target.value, customEnd || '')}
            className="px-3 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomChange?.(customStart || '', e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const sendTransactionEmail = async (transaction: MaterialTransaction) => {
  try {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (!savedSettings) return;
    
    const settings = JSON.parse(savedSettings);
    if (!settings.emailAlerts || !settings.transactionEmails || !settings.emailRecipients) return;

    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transaction',
        to: settings.emailRecipients,
        data: {
          transactionType: transaction.transactionType,
          materialCode: transaction.materialCode,
          materialDescription: transaction.materialDescription,
          quantity: transaction.quantity,
          unit: transaction.unit,
          user: transaction.user,
          reference: transaction.reference,
          date: transaction.date,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send transaction email:', error);
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function TransactionsPage() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<MaterialTransaction | null>(null);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'receiving' | 'issuance'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  
  // Sort state
  const [sortBy, setSortBy] = useState<'date' | 'quantity' | 'materialCode'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // View mode: 'table' or 'timeline'
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Form data
  const [formData, setFormData] = useState<Partial<MaterialTransaction>>({
    materialCode: '',
    materialDescription: '',
    transactionType: 'receiving',
    quantity: 0,
    unit: '',
    user: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD for date input (issuance/receiving date)
  });

  // Custom modal states
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; transaction: MaterialTransaction | null }>({
    isOpen: false,
    transaction: null,
  });
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; onConfirm: () => void }>({
    isOpen: false,
    onConfirm: () => {},
  });
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const generateReference = (type: 'receiving' | 'issuance') => {
    const prefix = type === 'receiving' ? 'RCV' : 'ISS';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${random}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [transactionsData, materialsData] = await Promise.all([
      getTransactionsFromSupabase(),
      getMaterialsFromSupabase()
    ]);
    setTransactions(transactionsData);
    setMaterials(materialsData);
    setIsLoading(false);
  };

  // Filter and sort logic
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.materialCode?.toLowerCase().includes(search) ||
        t.materialDescription?.toLowerCase().includes(search) ||
        t.reference?.toLowerCase().includes(search) ||
        t.user?.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.transactionType === typeFilter);
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateRange === 'today') {
      filtered = filtered.filter(t => new Date(t.date) >= today);
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.date) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
    } else if (dateRange === 'custom' && customDateStart && customDateEnd) {
      const start = new Date(customDateStart);
      const end = new Date(customDateEnd);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === 'materialCode') {
        comparison = a.materialCode.localeCompare(b.materialCode);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, dateRange, customDateStart, customDateEnd, sortBy, sortOrder]);

  // Group transactions by date for timeline view
  const groupedByDate = useMemo(() => {
    const grouped: { [key: string]: MaterialTransaction[] } = {};
    filteredAndSortedTransactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    return grouped;
  }, [filteredAndSortedTransactions]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const receiving = transactions.filter(t => t.transactionType === 'receiving');
    const issuance = transactions.filter(t => t.transactionType === 'issuance');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = transactions.filter(t => new Date(t.date) >= today);
    
    // Most active material
    const materialCounts: Record<string, number> = {};
    transactions.forEach(t => {
      materialCounts[t.materialCode] = (materialCounts[t.materialCode] || 0) + 1;
    });
    const mostActive = Object.entries(materialCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalReceiving: receiving.length,
      totalIssuance: issuance.length,
      receivingQty: receiving.reduce((sum, t) => sum + t.quantity, 0),
      issuanceQty: issuance.reduce((sum, t) => sum + t.quantity, 0),
      todayCount: todayTransactions.length,
      mostActiveMaterial: mostActive ? mostActive[0] : 'N/A',
      mostActiveCount: mostActive ? mostActive[1] : 0,
    };
  }, [transactions]);

  const processTransaction = async () => {
    const selectedMaterial = materials.find(m => m.materialCode === formData.materialCode);
    
    setIsSaving(true);

    if (isEditMode && selectedTransaction) {
      // Update existing transaction
      const dateStr = formData.date && formData.date.length >= 10
        ? (formData.date.includes('T') ? formData.date : formData.date + 'T12:00:00.000Z')
        : selectedTransaction.date;
      const updatedTransaction: MaterialTransaction = {
        ...selectedTransaction,
        materialCode: formData.materialCode!,
        materialDescription: formData.materialDescription || selectedMaterial?.description || '',
        transactionType: formData.transactionType as 'receiving' | 'issuance',
        quantity: formData.quantity || 0,
        unit: formData.unit || selectedMaterial?.unit || '',
        date: dateStr,
        user: formData.user!.trim(),
        notes: formData.notes?.trim(),
      };
      
      const success = await updateTransactionInSupabase(updatedTransaction, selectedTransaction);
      
      if (success) {
        await loadData();
        closeModals();
      } else {
        showAlert('Error', 'Failed to update transaction. Please try again.', 'error');
      }
    } else {
      // Create new transaction
      const dateStr = formData.date && formData.date.length >= 10
        ? (formData.date.includes('T') ? formData.date : formData.date + 'T12:00:00.000Z')
        : new Date().toISOString();
      const transaction: MaterialTransaction = {
        id: generateId(),
        materialCode: formData.materialCode!,
        materialDescription: formData.materialDescription || selectedMaterial?.description || '',
        transactionType: formData.transactionType as 'receiving' | 'issuance',
        quantity: formData.quantity || 0,
        unit: formData.unit || selectedMaterial?.unit || '',
        date: dateStr,
        user: formData.user!.trim(),
        reference: generateReference(formData.transactionType as 'receiving' | 'issuance'),
        notes: formData.notes?.trim(),
      };
      
      const success = await saveTransactionToSupabase(transaction);
      
      if (success) {
        await updateMaterialQuantity(
          transaction.materialCode, 
          transaction.quantity, 
          transaction.transactionType
        );
        await sendTransactionEmail(transaction);
        await loadData();
        closeModals();
      } else {
        showAlert('Error', 'Failed to save transaction. Please try again.', 'error');
      }
    }
    
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.materialCode) {
      showAlert('Validation Error', 'Please select a material', 'warning');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      showAlert('Validation Error', 'Please enter a valid quantity (greater than 0)', 'warning');
      return;
    }
    if (!formData.user?.trim()) {
      showAlert('Validation Error', 'Please enter a user name', 'warning');
      return;
    }
    
    const selectedMaterial = materials.find(m => m.materialCode === formData.materialCode);
    
    if (formData.transactionType === 'issuance' && selectedMaterial) {
      if (formData.quantity > selectedMaterial.quantity) {
        // Show warning modal instead of confirm
        setWarningModal({
          isOpen: true,
          onConfirm: () => {
            setWarningModal({ isOpen: false, onConfirm: () => {} });
            processTransaction();
          },
        });
        return;
      }
    }

    await processTransaction();
  };

  const handleDeleteClick = (transaction: MaterialTransaction) => {
    setDeleteModal({ isOpen: true, transaction });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.transaction) return;
    
    setIsSaving(true);
    const success = await deleteTransactionFromSupabase(deleteModal.transaction);
    setDeleteModal({ isOpen: false, transaction: null });
    
    if (success) {
      await loadData();
      closeModals();
    } else {
      showAlert('Error', 'Failed to delete transaction. Please try again.', 'error');
    }
    setIsSaving(false);
  };

  const handleMaterialChange = (materialCode: string) => {
    const material = materials.find(m => m.materialCode === materialCode);
    setFormData({
      ...formData,
      materialCode,
      materialDescription: material?.description || '',
      unit: material?.unit || '',
    });
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditMode(false);
    setSelectedTransaction(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      materialCode: '',
      materialDescription: '',
      transactionType: 'receiving',
      quantity: 0,
      unit: '',
      user: '',
      notes: '',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const openViewModal = (transaction: MaterialTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const openEditModal = (transaction: MaterialTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      materialCode: transaction.materialCode,
      materialDescription: transaction.materialDescription,
      transactionType: transaction.transactionType,
      quantity: transaction.quantity,
      unit: transaction.unit,
      user: transaction.user,
      notes: transaction.notes || '',
      date: transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(41, 37, 36);
      doc.text('Transaction Report', 14, 22);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${filteredAndSortedTransactions.length}`, 14, 36);

      // Summary stats
      doc.setFontSize(12);
      doc.setTextColor(41, 37, 36);
      doc.text('Summary', 14, 48);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Receiving: ${stats.totalReceiving} transactions (${stats.receivingQty.toLocaleString()} units)`, 14, 56);
      doc.text(`Issuance: ${stats.totalIssuance} transactions (${stats.issuanceQty.toLocaleString()} units)`, 14, 62);

      // Table
      const tableData = filteredAndSortedTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.transactionType === 'receiving' ? 'RCV' : 'ISS',
        t.reference,
        t.materialCode,
        t.quantity.toString(),
        t.unit,
        t.user
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['Date', 'Type', 'Reference', 'Material', 'Qty', 'Unit', 'User']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      doc.save(`transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      showAlert('Export Error', 'Failed to export PDF. Please try again.', 'error');
    }
  };

  // Dropdown options
  const transactionTypeOptions: DropdownOption[] = [
    { value: 'receiving', label: 'Receiving', subLabel: 'Add materials to inventory' },
    { value: 'issuance', label: 'Issuance', subLabel: 'Remove materials from inventory' },
  ];

  const materialOptions: DropdownOption[] = materials.map(m => ({
    value: m.materialCode,
    label: m.materialCode,
    subLabel: m.description,
  }));

  // Theme-aware classes
  const bgMain = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' 
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
  const bgHeader = theme === 'dark'
    ? 'bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80'
    : 'bg-gradient-to-r from-white/90 via-white/80 to-white/90';
  const borderColor = theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const borderCard = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
  const bgTableHeader = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100';
  const textTertiary = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';
  const hoverRow = theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';
  const divideColor = theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200';

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${theme === 'dark' ? 'bg-emerald-500/5' : 'bg-emerald-500/10'}`} />
        <div className={`absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full blur-3xl ${theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
      </div>

      {/* Header */}
      <div className={`relative border-b ${borderColor} transition-colors duration-300`}>
        <div className={`absolute inset-0 ${bgHeader} backdrop-blur-xl`} />
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary} tracking-tight transition-colors duration-300`}>Material Transactions</h1>
              <p className={`text-sm ${textSecondary} mt-1 transition-colors duration-300`}>Record and manage material receiving and issuance activities</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Button */}
              <button
                onClick={exportToPDF}
                className={`group px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30 hover:border-slate-600/50' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 hover:border-slate-300'
                }`}
                title="Export to PDF"
              >
                <Download size={16} className="text-red-400" />
                <span className={`text-sm font-medium ${textTertiary} transition-colors duration-300`}>Export PDF</span>
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setIsEditMode(false);
                  setIsModalOpen(true);
                }}
                className="group relative px-5 py-2.5 overflow-hidden rounded-xl font-semibold text-sm transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400 transition-all duration-300" />
                <div className="relative flex items-center gap-2 text-white">
                  <Plus size={18} />
                  New Transaction
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">RECEIVING</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.totalReceiving}</p>
            <p className={`text-xs ${textSecondary} mt-1 transition-colors duration-300`}>{stats.receivingQty.toLocaleString()} units total</p>
          </div>
          
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <TrendingDown size={18} className="text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">ISSUANCE</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.totalIssuance}</p>
            <p className={`text-xs ${textSecondary} mt-1 transition-colors duration-300`}>{stats.issuanceQty.toLocaleString()} units total</p>
          </div>
          
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Clock size={18} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">TODAY</span>
            </div>
            <p className={`text-2xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.todayCount}</p>
            <p className={`text-xs ${textSecondary} mt-1 transition-colors duration-300`}>transactions today</p>
          </div>
          
          <div className="premium-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <BarChart3 size={18} className="text-purple-400" />
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">TOP MATERIAL</span>
            </div>
            <p className={`text-lg font-bold ${textPrimary} truncate transition-colors duration-300`} title={stats.mostActiveMaterial}>{stats.mostActiveMaterial}</p>
            <p className={`text-xs ${textSecondary} mt-1 transition-colors duration-300`}>{stats.mostActiveCount} transactions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${textSecondary} transition-colors duration-300`} size={20} />
            <input
              type="text"
              placeholder="Search by material, reference, user..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl ${textPrimary} placeholder-slate-500 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} border ${borderCard} focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all duration-300`}
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className={textSecondary} />
              <span className={`text-sm ${textSecondary} transition-colors duration-300`}>Type:</span>
              <div className="flex gap-1">
                {['all', 'receiving', 'issuance'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTypeFilter(type as typeof typeFilter);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                      typeFilter === type
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'text-slate-400 hover:text-white bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700/50 hidden md:block" />

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <span className="text-sm text-slate-400">Date:</span>
              <DateRangePicker
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setCurrentPage(1);
                }}
                customStart={customDateStart}
                customEnd={customDateEnd}
                onCustomChange={(start, end) => {
                  setCustomDateStart(start);
                  setCustomDateEnd(end);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="h-6 w-px bg-slate-700/50 hidden md:block" />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${textSecondary} transition-colors duration-300`}>View:</span>
              <div className="flex gap-1 bg-slate-800/30 rounded-lg p-1 border border-slate-700/30">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <List size={14} />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 flex items-center gap-1.5 ${
                    viewMode === 'timeline'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Timeline View"
                >
                  <History size={14} />
                  History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table or Timeline View */}
        {viewMode === 'table' ? (
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className={bgTableHeader}>
                <tr className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'} transition-colors duration-300`}>
                  <th 
                    className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors duration-300`}
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Date &amp; Time
                      {sortBy === 'date' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider transition-colors duration-300`}>Type</th>
                  <th 
                    className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors duration-300`}
                    onClick={() => handleSort('materialCode')}
                  >
                    <div className="flex items-center gap-2">
                      Material Code
                      {sortBy === 'materialCode' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider transition-colors duration-300`}>Description</th>
                  <th 
                    className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors duration-300`}
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-2">
                      Quantity
                      {sortBy === 'quantity' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider transition-colors duration-300`}>User</th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider transition-colors duration-300`}>Reference</th>
                  <th className={`px-6 py-4 text-right text-xs font-bold ${textSecondary} uppercase tracking-wider transition-colors duration-300`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${divideColor} transition-colors duration-300`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                          <Loader2 className="relative animate-spin text-amber-500 mb-4" size={40} />
                        </div>
                        <p className={`${textSecondary} font-medium transition-colors duration-300`}>Loading transactions...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className={`p-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-2xl mb-4 border ${borderCard} transition-colors duration-300`}>
                          <FileText className={textMuted} size={32} />
                        </div>
                        <p className={`${textPrimary} font-semibold mb-1 transition-colors duration-300`}>No transactions found</p>
                        <p className={`${textMuted} text-sm transition-colors duration-300`}>Try adjusting your filters or create a new transaction</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id} 
                      className={`${hoverRow} transition-colors group cursor-pointer`}
                      onClick={() => openViewModal(transaction)}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300`}>
                        <span className={`block font-medium ${textPrimary} transition-colors duration-300`}>
                          {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`block text-xs ${textMuted} transition-colors duration-300`}>
                          {new Date(transaction.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                          transaction.transactionType === 'receiving'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {transaction.transactionType === 'receiving' ? (
                            <><TrendingUp size={12} className="mr-1.5" />Receiving</>
                          ) : (
                            <><TrendingDown size={12} className="mr-1.5" />Issuance</>
                          )}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${textPrimary} transition-colors duration-300`}>{transaction.materialCode}</td>
                      <td className={`px-6 py-4 text-sm ${textTertiary} max-w-xs truncate transition-colors duration-300`} title={transaction.materialDescription}>{transaction.materialDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${
                          transaction.transactionType === 'receiving' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {transaction.transactionType === 'receiving' ? '+' : '-'}{transaction.quantity} {transaction.unit}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${textTertiary} transition-colors duration-300`}>{transaction.user}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${textMuted} font-mono transition-colors duration-300`}>{transaction.reference}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewModal(transaction);
                            }}
                            className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                            title="View Details"
                          >
                            <Eye size={16} className={`${textSecondary} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-slate-900'} transition-colors`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(transaction);
                            }}
                            className={`p-2 ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
                            title="Edit"
                          >
                            <Edit3 size={16} className="text-slate-400 hover:text-amber-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(transaction);
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-slate-400 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
              <p className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600/50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
        ) : (
          /* Timeline/History View - Enhanced */
          <div className="space-y-6">
            {isLoading ? (
              <div className="premium-card p-12">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                    <Loader2 className="relative animate-spin text-amber-500 mb-4" size={40} />
                  </div>
                  <p className={`${textSecondary} font-medium transition-colors duration-300`}>Loading history...</p>
                </div>
              </div>
            ) : Object.keys(groupedByDate).length === 0 ? (
              <div className="premium-card p-12">
                <div className="flex flex-col items-center">
                  <div className={`p-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-2xl mb-4 border ${borderCard} transition-colors duration-300`}>
                    <FileText className={textMuted} size={32} />
                  </div>
                  <p className={`${textPrimary} font-semibold mb-1 transition-colors duration-300`}>No transactions found</p>
                  <p className={`${textMuted} text-sm transition-colors duration-300`}>Try adjusting your filters or create a new transaction</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([date, dateTransactions]) => {
                const receiving = dateTransactions.filter(t => t.transactionType === 'receiving');
                const issuance = dateTransactions.filter(t => t.transactionType === 'issuance');
                const receivingTotal = receiving.reduce((sum, t) => sum + t.quantity, 0);
                const issuanceTotal = issuance.reduce((sum, t) => sum + t.quantity, 0);
                
                return (
                  <div key={date} className={`premium-card p-6 space-y-5`}>
                    {/* Enhanced Date Header with Summary */}
                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b ${borderColor}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'} rounded-xl border ${theme === 'dark' ? 'border-amber-500/20' : 'border-amber-200'}`}>
                          <Calendar className="text-amber-400" size={20} />
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${textPrimary} mb-1`}>{date}</h3>
                          <p className={`text-sm ${textSecondary}`}>
                            {dateTransactions.length} {dateTransactions.length === 1 ? 'transaction' : 'transactions'} total
                          </p>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {receiving.length > 0 && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'} border ${theme === 'dark' ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                            <TrendingUp size={14} className="text-emerald-400" />
                            <span className={`text-xs font-semibold text-emerald-400`}>
                              {receiving.length} received
                            </span>
                            <span className={`text-xs ${textMuted} ml-1`}>
                              (+{receivingTotal.toLocaleString()})
                            </span>
                          </div>
                        )}
                        {issuance.length > 0 && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'} border ${theme === 'dark' ? 'border-blue-500/20' : 'border-blue-200'}`}>
                            <TrendingDown size={14} className="text-blue-400" />
                            <span className={`text-xs font-semibold text-blue-400`}>
                              {issuance.length} issued
                            </span>
                            <span className={`text-xs ${textMuted} ml-1`}>
                              (–{issuanceTotal.toLocaleString()})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Receiving Section - Enhanced */}
                    {receiving.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`h-0.5 flex-1 ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-200'}`} />
                          <div className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'} rounded-lg border ${theme === 'dark' ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                            <div className={`p-1.5 ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'} rounded-lg`}>
                              <TrendingUp size={16} className="text-emerald-400" />
                            </div>
                            <span className={`text-sm font-bold text-emerald-400`}>
                              RECEIVING
                            </span>
                            <span className={`text-xs ${textMuted} ml-1`}>
                              ({receiving.length})
                            </span>
                          </div>
                          <div className={`h-0.5 flex-1 ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-200'}`} />
                        </div>
                        <div className="space-y-2.5">
                          {receiving.map((transaction) => (
                            <div
                              key={transaction.id}
                              onClick={() => openViewModal(transaction)}
                              className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30' : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300'} cursor-pointer transition-all group shadow-sm hover:shadow-md`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={`p-2 ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'} rounded-lg flex-shrink-0`}>
                                    <TrendingUp size={16} className="text-emerald-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold ${textPrimary} mb-1`}>{transaction.materialCode}</p>
                                        <p className={`text-xs ${textSecondary} line-clamp-2`}>{transaction.materialDescription}</p>
                                      </div>
                                      <div className={`px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'} flex-shrink-0`}>
                                        <span className={`text-sm font-bold text-emerald-400`}>
                                          +{transaction.quantity.toLocaleString()} {transaction.unit}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className={textMuted} />
                                        <span className={textMuted}>
                                          {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock size={12} className={textMuted} />
                                        <span className={textMuted}>
                                          {new Date(transaction.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      {transaction.reference && (
                                        <div className="flex items-center gap-1.5">
                                          <FileText size={12} className={textMuted} />
                                          <span className={textMuted}>{transaction.reference}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        <Package size={12} className={textMuted} />
                                        <span className={textMuted}>{transaction.user}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openViewModal(transaction);
                                  }}
                                  className={`p-2 ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0`}
                                  title="View Details"
                                >
                                  <Eye size={16} className={textSecondary} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Issuance Section - Enhanced */}
                    {issuance.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`h-0.5 flex-1 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-200'}`} />
                          <div className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg border ${theme === 'dark' ? 'border-blue-500/20' : 'border-blue-200'}`}>
                            <div className={`p-1.5 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg`}>
                              <TrendingDown size={16} className="text-blue-400" />
                            </div>
                            <span className={`text-sm font-bold text-blue-400`}>
                              ISSUANCE
                            </span>
                            <span className={`text-xs ${textMuted} ml-1`}>
                              ({issuance.length})
                            </span>
                          </div>
                          <div className={`h-0.5 flex-1 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-200'}`} />
                        </div>
                        <div className="space-y-2.5">
                          {issuance.map((transaction) => (
                            <div
                              key={transaction.id}
                              onClick={() => openViewModal(transaction)}
                              className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300'} cursor-pointer transition-all group shadow-sm hover:shadow-md`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={`p-2 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-lg flex-shrink-0`}>
                                    <TrendingDown size={16} className="text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold ${textPrimary} mb-1`}>{transaction.materialCode}</p>
                                        <p className={`text-xs ${textSecondary} line-clamp-2`}>{transaction.materialDescription}</p>
                                      </div>
                                      <div className={`px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'} flex-shrink-0`}>
                                        <span className={`text-sm font-bold text-blue-400`}>
                                          –{transaction.quantity.toLocaleString()} {transaction.unit}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className={textMuted} />
                                        <span className={textMuted}>
                                          {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock size={12} className={textMuted} />
                                        <span className={textMuted}>
                                          {new Date(transaction.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      {transaction.reference && (
                                        <div className="flex items-center gap-1.5">
                                          <FileText size={12} className={textMuted} />
                                          <span className={textMuted}>{transaction.reference}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5">
                                        <Package size={12} className={textMuted} />
                                        <span className={textMuted}>{transaction.user}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openViewModal(transaction);
                                  }}
                                  className={`p-2 ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-100 hover:bg-slate-200'} rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0`}
                                  title="View Details"
                                >
                                  <Eye size={16} className={textSecondary} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-lg animate-scale-in">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            
            <div className="premium-card relative p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <button
                  onClick={closeModals}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Transaction Type</label>
                  <CustomDropdown
                    options={transactionTypeOptions}
                    value={formData.transactionType || 'receiving'}
                    onChange={(value) => setFormData({ ...formData, transactionType: value as 'receiving' | 'issuance' })}
                    placeholder="Select transaction type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Material</label>
                  <CustomDropdown
                    options={materialOptions}
                    value={formData.materialCode || ''}
                    onChange={handleMaterialChange}
                    placeholder="Select Material"
                    searchable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Date (Issuance / Receiving)</label>
                  <input
                    type="date"
                    required
                    value={formData.date || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500 bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.quantity || ''}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500 bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all duration-300"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Unit</label>
                    <input
                      type="text"
                      required
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500 bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all duration-300"
                      placeholder="e.g., PCS, KG"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">User</label>
                  <input
                    type="text"
                    required
                    value={formData.user || ''}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500 bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all duration-300"
                    placeholder="Enter user name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500 bg-slate-900/50 border border-slate-700/50 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all duration-300 resize-none"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 premium-button flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {isEditMode ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      isEditMode ? 'Update Transaction' : 'Save Transaction'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 premium-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-lg animate-scale-in">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            
            <div className="premium-card relative p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
                <button
                  onClick={closeModals}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Transaction Type Badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl border ${
                  selectedTransaction.transactionType === 'receiving'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {selectedTransaction.transactionType === 'receiving' ? (
                    <><TrendingUp size={16} className="mr-2" />Receiving Transaction</>
                  ) : (
                    <><TrendingDown size={16} className="mr-2" />Issuance Transaction</>
                  )}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Reference</p>
                    <p className="font-mono font-semibold text-white">{selectedTransaction.reference}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Date</p>
                    <p className="font-semibold text-white">{new Date(selectedTransaction.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">Material</p>
                  <p className="font-semibold text-white">{selectedTransaction.materialCode}</p>
                  <p className="text-sm text-slate-400 mt-1">{selectedTransaction.materialDescription}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Quantity</p>
                    <p className={`text-xl font-bold ${
                      selectedTransaction.transactionType === 'receiving' ? 'text-emerald-400' : 'text-blue-400'
                    }`}>
                      {selectedTransaction.transactionType === 'receiving' ? '+' : '-'}{selectedTransaction.quantity} {selectedTransaction.unit}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Processed By</p>
                    <p className="font-semibold text-white">{selectedTransaction.user}</p>
                  </div>
                </div>

                {selectedTransaction.notes && (
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="text-slate-300">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700/50">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedTransaction);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl font-semibold transition-all border border-amber-500/20"
                >
                  <Edit3 size={18} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(selectedTransaction)}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold transition-all border border-red-500/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, transaction: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={deleteModal.transaction 
          ? `Are you sure you want to delete this transaction? This will ${deleteModal.transaction.transactionType === 'receiving' ? 'subtract' : 'add back'} ${deleteModal.transaction.quantity} ${deleteModal.transaction.unit} ${deleteModal.transaction.transactionType === 'receiving' ? 'from' : 'to'} the material quantity.`
          : 'Are you sure you want to delete this transaction?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isSaving}
      />

      {/* Quantity Warning Modal */}
      <ConfirmModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal({ isOpen: false, onConfirm: () => {} })}
        onConfirm={warningModal.onConfirm}
        title="Low Stock Warning"
        message={`Warning: Issuing ${formData.quantity} ${formData.unit} but only ${materials.find(m => m.materialCode === formData.materialCode)?.quantity || 0} available. Continue anyway?`}
        confirmText="Continue"
        cancelText="Cancel"
        type="warning"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
