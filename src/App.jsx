import { useState, useEffect, useMemo } from 'react'
import logoImg from './assets/hero.jpeg'
import './App.css'
import { supabase } from './supabaseClient'

const sanitizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith('javascript:')) {
    return '#';
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('Home')
  const [currentPage, setCurrentPage] = useState(
    window.location.pathname === '/projects' ? 'projects' : 'home'
  )
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', reason: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastTitle, setToastTitle] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [signInData, setSignInData] = useState({ usernameOrEmail: '', password: '' })
  const [isSignUp, setIsSignUp] = useState(false)
  const [signUpData, setSignUpData] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null)
  const [adminsData, setAdminsData] = useState([
    { username: 'admin', email: 'admin@sydions.org', password: 'password123' }
  ])

  // Admin and Dashboard states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  })
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [adminActiveTab, setAdminActiveTab] = useState('home')
  const [contactRequests, setContactRequests] = useState([])
  const [selectedReason, setSelectedReason] = useState(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState(null)
  const [projectsSubTab, setProjectsSubTab] = useState('active')
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [rejectionTargetProjectId, setRejectionTargetProjectId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewTargetProject, setViewTargetProject] = useState(null)
  const [isVisitorViewModalOpen, setIsVisitorViewModalOpen] = useState(false)
  const [visitorViewTargetProject, setVisitorViewTargetProject] = useState(null)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [activePopoverProjectId, setActivePopoverProjectId] = useState(null)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })

  // Developer Dashboard states
  const [isDeveloperLoggedIn, setIsDeveloperLoggedIn] = useState(() => {
    return localStorage.getItem('currentDeveloper') !== null;
  })
  const [loggedInDeveloper, setLoggedInDeveloper] = useState(() => {
    const stored = localStorage.getItem('currentDeveloper');
    return stored ? JSON.parse(stored) : null;
  })
  const [devActiveTab, setDevActiveTab] = useState('home')
  const [devProjectsSubTab, setDevProjectsSubTab] = useState('pending')
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [viewReasonProject, setViewReasonProject] = useState(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [adminProfileDropdownOpen, setAdminProfileDropdownOpen] = useState(false)
  const [isClearAllNotificationsModalOpen, setIsClearAllNotificationsModalOpen] = useState(false)
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    domain: 'AI',
    demoLink: '',
    builtBy: '',
    technologiesUsed: '',
    thumbnail: ''
  })

  // Admin Developer Management modal states
  const [isAddDevModalOpen, setIsAddDevModalOpen] = useState(false)
  const [addDevData, setAddDevData] = useState({ username: '', email: '', password: '', confirmPassword: '', gender: 'Prefer Not To Say' })
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
  const [isEditDevModalOpen, setIsEditDevModalOpen] = useState(false)
  const [editDevTarget, setEditDevTarget] = useState(null)
  const [editDevData, setEditDevData] = useState({ username: '', email: '' })
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null)
  const [resetPasswordData, setResetPasswordData] = useState({ password: '', confirmPassword: '' })
  const [activeActionMenuId, setActiveActionMenuId] = useState(null)

  const [projectsData, setProjectsData] = useState([])
  const [developersData, setDevelopersData] = useState([])
  const [notifications, setNotifications] = useState([])

  const [showAddDevPassword, setShowAddDevPassword] = useState(false)
  const [showAddDevConfirmPassword, setShowAddDevConfirmPassword] = useState(false)
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 })

  const [pageAdminActiveProjects, setPageAdminActiveProjects] = useState(1)
  const [pageAdminApprovedProjects, setPageAdminApprovedProjects] = useState(1)
  const [pageAdminRejectedProjects, setPageAdminRejectedProjects] = useState(1)
  const [pageAdminDevs, setPageAdminDevs] = useState(1)
  const [pageAdminContacts, setPageAdminContacts] = useState(1)
  const [pageDevPendingProjects, setPageDevPendingProjects] = useState(1)
  const [pageDevApprovedProjects, setPageDevApprovedProjects] = useState(1)
  const [pageDevRejectedProjects, setPageDevRejectedProjects] = useState(1)

  const [tableSearch, setTableSearch] = useState('')
  const [tableStartDate, setTableStartDate] = useState('')
  const [tableEndDate, setTableEndDate] = useState('')

  // Load data from Supabase / localStorage
  const fetchAllData = async () => {
    try {
      // Load projects from localStorage
      const projsRaw = localStorage.getItem('sydions_projects');
      const loadedProjects = projsRaw ? JSON.parse(projsRaw) : [];
      setProjectsData(loadedProjects);

      // Load developers from profiles table
      const { data: devs, error: devsErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'developer')
        .order('id', { ascending: false });
      if (devsErr) {
        console.error("Error fetching developers:", devsErr.message);
      } else if (devs) {
        setDevelopersData(devs.map(d => ({
          id: d.id,
          name: d.username,
          email: d.email,
          projectsCount: loadedProjects.filter(p => p.email.toLowerCase() === d.email.toLowerCase()).length,
          status: d.status === 'active' ? 'Active' : 'Disabled',
          gender: d.gender || 'Prefer Not To Say',
          created_at: d.created_at || new Date().toISOString()
        })));
      }

      // Load notifications from Supabase
      try {
        const { data: dbNotifs, error: dbNotifsErr } = await supabase
          .from('notifications')
          .select('*')
          .order('id', { ascending: false });
        
        if (dbNotifsErr) {
          throw dbNotifsErr;
        }

        if (dbNotifs) {
          const mapped = dbNotifs.map(n => ({
            id: n.id,
            text: n.text,
            time: n.time_text,
            read: n.is_read
          }));
          setNotifications(mapped);
          localStorage.setItem('sydions_notifications', JSON.stringify(mapped));
        } else {
          const notifsRaw = localStorage.getItem('sydions_notifications');
          setNotifications(notifsRaw ? JSON.parse(notifsRaw) : []);
        }
      } catch (dbErr) {
        console.warn("Could not load notifications from Supabase, using localStorage.", dbErr.message);
        const notifsRaw = localStorage.getItem('sydions_notifications');
        setNotifications(notifsRaw ? JSON.parse(notifsRaw) : []);
      }

      // Load contact requests from contact_messages
      const { data: contacts, error: contactsErr } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (contactsErr) {
        console.error("Error fetching contact requests:", contactsErr.message);
      } else if (contacts) {
        setContactRequests(contacts);
      }
    } catch (err) {
      console.error("Error loading Supabase data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Verify developer is still active in profiles table on load
    const verifyDevStatus = async () => {
      const stored = localStorage.getItem('currentDeveloper');
      if (stored) {
        try {
          const devObj = JSON.parse(stored);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', devObj.id)
            .maybeSingle();
          if (profile && profile.status !== 'active') {
            localStorage.removeItem('currentDeveloper');
            setIsDeveloperLoggedIn(false);
            setLoggedInDeveloper(null);
            triggerToast("Account Disabled", "Your developer account has been disabled. Contact an administrator.");
          }
        } catch (e) {
          console.error("Error verifying developer status:", e);
        }
      }
    };
    verifyDevStatus();
  }, []);

  // SPA Route Navigator
  const navigateTo = (page) => {
    window.history.pushState({}, '', page === 'projects' ? '/projects' : '/')
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname === '/projects' ? 'projects' : 'home')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const triggerToast = (title, message, type = 'success') => {
    setToastTitle(title)
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout)
    }
    window.toastTimeout = setTimeout(() => {
      setShowToast(false)
    }, 3500)
  }

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to mark all as read in Supabase.", err);
    }
    
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('sydions_notifications', JSON.stringify(updated));
    triggerToast("Marked Read", "All notifications marked as read.");
  };

  const handleMarkNotificationAsRead = async (notifId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId);
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to mark notification as read in Supabase.", err);
    }
    
    const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('sydions_notifications', JSON.stringify(updated));
  };

  const handleDeleteNotification = async (notifId, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notifId);
      if (error) throw error;
      triggerToast("Deleted", "Notification deleted.");
    } catch (err) {
      console.warn("Failed to delete notification from Supabase.", err);
    }

    const updated = notifications.filter(n => n.id !== notifId);
    setNotifications(updated);
    localStorage.setItem('sydions_notifications', JSON.stringify(updated));
  };

  const handleClearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', 0);
      if (error) throw error;
      triggerToast("Cleared", "All notifications cleared.");
    } catch (err) {
      console.warn("Failed to clear notifications in Supabase.", err);
    }

    setNotifications([]);
    localStorage.setItem('sydions_notifications', JSON.stringify([]));
    setIsClearAllNotificationsModalOpen(false);
  };

  const recentActivities = useMemo(() => {
    const activities = [];

    // 1. Projects
    projectsData.forEach(p => {
      activities.push({
        id: `proj-sub-${p.id}`,
        type: 'project_submitted',
        title: 'Project Submission',
        desc: `"${p.title}" was submitted by ${p.developer}.`,
        date: new Date(p.dateTime.replace(' ', 'T') + 'Z'),
        dateStr: p.dateTime
      });

      if (p.status === 'approved') {
        activities.push({
          id: `proj-app-${p.id}`,
          type: 'project_approved',
          title: 'Project Approved',
          desc: `"${p.title}" was approved by administrator.`,
          date: new Date(new Date(p.dateTime.replace(' ', 'T') + 'Z').getTime() + 1000 * 60 * 10),
          dateStr: p.dateTime
        });
      } else if (p.status === 'rejected') {
        activities.push({
          id: `proj-rej-${p.id}`,
          type: 'project_rejected',
          title: 'Project Rejected',
          desc: `"${p.title}" was rejected: "${p.rejectionReason}".`,
          date: new Date(new Date(p.dateTime.replace(' ', 'T') + 'Z').getTime() + 1000 * 60 * 10),
          dateStr: p.dateTime
        });
      }
    });

    // 2. Contact messages
    contactRequests.forEach(c => {
      const createdDate = c.created_at ? new Date(c.created_at) : new Date();
      activities.push({
        id: `contact-${c.id}`,
        type: 'contact_request',
        title: 'Inquiry Received',
        desc: `Contact request from ${c.name || c.full_name || 'N/A'} (${c.email || 'N/A'}).`,
        date: createdDate,
        dateStr: createdDate.toLocaleString()
      });
    });

    // Sort descending
    activities.sort((a, b) => b.date - a.date);
    return activities.slice(0, 6);
  }, [projectsData, contactRequests]);

  const resetTableFilters = () => {
    setTableSearch('')
    setTableStartDate('')
    setTableEndDate('')
    setPageAdminActiveProjects(1)
    setPageAdminApprovedProjects(1)
    setPageAdminRejectedProjects(1)
    setPageAdminDevs(1)
    setPageAdminContacts(1)
    setPageDevPendingProjects(1)
    setPageDevApprovedProjects(1)
    setPageDevRejectedProjects(1)
  }

  const changeAdminTab = (tab) => {
    setAdminActiveTab(tab);
    resetTableFilters();
  };

  const changeProjectsSubTab = (subtab) => {
    setProjectsSubTab(subtab);
    resetTableFilters();
  };

  const changeDevTab = (tab) => {
    setDevActiveTab(tab);
    resetTableFilters();
  };

  const changeDevProjectsSubTab = (subtab) => {
    setDevProjectsSubTab(subtab);
    resetTableFilters();
  };

  const matchesDateRange = (dateStringOrTimestamp) => {
    if (!dateStringOrTimestamp) return true;
    let dateStr = String(dateStringOrTimestamp);
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T') + ':00Z';
    }
    const recordTime = new Date(dateStr).getTime();
    if (isNaN(recordTime)) return true;

    if (tableStartDate) {
      const start = new Date(tableStartDate + 'T00:00:00Z').getTime();
      if (recordTime < start) return false;
    }
    if (tableEndDate) {
      const end = new Date(tableEndDate + 'T23:59:59Z').getTime();
      if (recordTime > end) return false;
    }
    return true;
  };

  const matchesSearch = (textFields) => {
    if (!tableSearch) return true;
    const query = tableSearch.toLowerCase().trim();
    return textFields.some(field => field && String(field).toLowerCase().includes(query));
  };

  const renderTableUtilities = (placeholder = "Search...") => {
    return (
      <div className="table-utilities-bar">
        <div className="utility-search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setPageAdminActiveProjects(1);
              setPageAdminApprovedProjects(1);
              setPageAdminRejectedProjects(1);
              setPageAdminDevs(1);
              setPageAdminContacts(1);
              setPageDevPendingProjects(1);
              setPageDevApprovedProjects(1);
              setPageDevRejectedProjects(1);
            }}
            className="utility-search-input"
          />
        </div>
        <div className="utility-date-filters">
          <div className="date-input-group">
            <label className="utility-date-label">From</label>
            <input
              type="date"
              value={tableStartDate}
              onChange={(e) => {
                setTableStartDate(e.target.value);
                setPageAdminActiveProjects(1);
                setPageAdminApprovedProjects(1);
                setPageAdminRejectedProjects(1);
                setPageAdminDevs(1);
                setPageAdminContacts(1);
                setPageDevPendingProjects(1);
                setPageDevApprovedProjects(1);
                setPageDevRejectedProjects(1);
              }}
              className="utility-date-input"
            />
          </div>
          <div className="date-input-group">
            <label className="utility-date-label">To</label>
            <input
              type="date"
              value={tableEndDate}
              onChange={(e) => {
                setTableEndDate(e.target.value);
                setPageAdminActiveProjects(1);
                setPageAdminApprovedProjects(1);
                setPageAdminRejectedProjects(1);
                setPageAdminDevs(1);
                setPageAdminContacts(1);
                setPageDevPendingProjects(1);
                setPageDevApprovedProjects(1);
                setPageDevRejectedProjects(1);
              }}
              className="utility-date-input"
            />
          </div>
          {(tableSearch || tableStartDate || tableEndDate) && (
            <button className="utility-clear-btn" onClick={resetTableFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPagination = (currentPage, totalItems, onPageChange) => {
    const totalPages = Math.ceil(totalItems / 10);
    if (totalPages <= 1) return null;

    return (
      <div className="table-pagination-container">
        <button
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    );
  };

  // Memos for Filtered and Paginated Table lists
  const filteredAdminActiveProjects = useMemo(() => {
    return projectsData
      .filter(p => p.status === 'pending')
      .filter(p => matchesDateRange(p.dateTime))
      .filter(p => matchesSearch([p.title, p.developer, p.category, p.description, p.tags?.join(', ')]));
  }, [projectsData, tableSearch, tableStartDate, tableEndDate]);

  const paginatedAdminActiveProjects = useMemo(() => {
    const start = (pageAdminActiveProjects - 1) * 10;
    return filteredAdminActiveProjects.slice(start, start + 10);
  }, [filteredAdminActiveProjects, pageAdminActiveProjects]);

  const filteredAdminApprovedProjects = useMemo(() => {
    return projectsData
      .filter(p => p.status === 'approved')
      .filter(p => matchesDateRange(p.dateTime))
      .filter(p => matchesSearch([p.title, p.developer, p.category, p.description, p.tags?.join(', ')]));
  }, [projectsData, tableSearch, tableStartDate, tableEndDate]);

  const paginatedAdminApprovedProjects = useMemo(() => {
    const start = (pageAdminApprovedProjects - 1) * 10;
    return filteredAdminApprovedProjects.slice(start, start + 10);
  }, [filteredAdminApprovedProjects, pageAdminApprovedProjects]);

  const filteredAdminRejectedProjects = useMemo(() => {
    return projectsData
      .filter(p => p.status === 'rejected')
      .filter(p => matchesDateRange(p.dateTime))
      .filter(p => matchesSearch([p.title, p.developer, p.category, p.description, p.rejectionReason]));
  }, [projectsData, tableSearch, tableStartDate, tableEndDate]);

  const paginatedAdminRejectedProjects = useMemo(() => {
    const start = (pageAdminRejectedProjects - 1) * 10;
    return filteredAdminRejectedProjects.slice(start, start + 10);
  }, [filteredAdminRejectedProjects, pageAdminRejectedProjects]);

  const filteredAdminDevs = useMemo(() => {
    return developersData
      .filter(d => matchesDateRange(d.created_at))
      .filter(d => matchesSearch([d.name, d.email, d.gender, d.status]));
  }, [developersData, tableSearch, tableStartDate, tableEndDate]);

  const paginatedAdminDevs = useMemo(() => {
    const start = (pageAdminDevs - 1) * 10;
    return filteredAdminDevs.slice(start, start + 10);
  }, [filteredAdminDevs, pageAdminDevs]);

  const filteredAdminContacts = useMemo(() => {
    return contactRequests
      .filter(req => matchesDateRange(req.created_at))
      .filter(req => matchesSearch([req.name || req.full_name || '', req.email || '', req.phone || '', req.reason || '']));
  }, [contactRequests, tableSearch, tableStartDate, tableEndDate]);

  const paginatedAdminContacts = useMemo(() => {
    const start = (pageAdminContacts - 1) * 10;
    return filteredAdminContacts.slice(start, start + 10);
  }, [filteredAdminContacts, pageAdminContacts]);

  const filteredDevPendingProjects = useMemo(() => {
    if (!loggedInDeveloper) return [];
    return projectsData
      .filter(p => p.developer.toLowerCase() === loggedInDeveloper.name.toLowerCase() && p.status === 'pending')
      .filter(p => matchesDateRange(p.dateTime))
      .filter(p => matchesSearch([p.title, p.category, p.description, p.tags?.join(', ')]));
  }, [projectsData, loggedInDeveloper, tableSearch, tableStartDate, tableEndDate]);

  const paginatedDevPendingProjects = useMemo(() => {
    const start = (pageDevPendingProjects - 1) * 10;
    return filteredDevPendingProjects.slice(start, start + 10);
  }, [filteredDevPendingProjects, pageDevPendingProjects]);

  const filteredDevApprovedProjects = useMemo(() => {
    if (!loggedInDeveloper) return [];
    return projectsData
      .filter(p => p.developer.toLowerCase() === loggedInDeveloper.name.toLowerCase() && p.status === 'approved')
      .filter(p => matchesDateRange(p.dateTime))
      .filter(p => matchesSearch([p.title, p.category, p.description, p.tags?.join(', ')]));
  }, [projectsData, loggedInDeveloper, tableSearch, tableStartDate, tableEndDate]);

  const paginatedDevApprovedProjects = useMemo(() => {
    const start = (pageDevApprovedProjects - 1) * 10;
    return filteredDevApprovedProjects.slice(start, start + 10);
  }, [filteredDevApprovedProjects, pageDevApprovedProjects]);

  const filteredDevRejectedProjects = useMemo(() => {
    if (!loggedInDeveloper) return [];
    return projectsData
      .filter(p => p.developer.toLowerCase() === loggedInDeveloper.name.toLowerCase() && p.status === 'rejected')
      .filter(p => matchesDateRange(p.dateTime))
      .filter(p => matchesSearch([p.title, p.category, p.description, p.rejectionReason, p.tags?.join(', ')]));
  }, [projectsData, loggedInDeveloper, tableSearch, tableStartDate, tableEndDate]);

  const paginatedDevRejectedProjects = useMemo(() => {
    const start = (pageDevRejectedProjects - 1) * 10;
    return filteredDevRejectedProjects.slice(start, start + 10);
  }, [filteredDevRejectedProjects, pageDevRejectedProjects]);

  const handleFormSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          reason: formData.reason
        }
      ]);

    if (error) {
      triggerToast("Error", error.message);
      return;
    }

    setFormData({
      fullName: '',
      email: '',
      phone: '',
      reason: ''
    });

    triggerToast(
      "Request Submitted!",
      "We'll contact you soon."
    );

  } catch (err) {
    triggerToast("Error", "Something went wrong.");
  } finally {
    setIsSubmitting(false);
  }
};
  const closeModal = () => {
    setIsSignInModalOpen(false)
    setIsSignUp(false)
    setSignInData({ usernameOrEmail: '', password: '' })
    setSignUpData({ fullName: '', username: '', email: '', password: '', confirmPassword: '' })
  }

  const handleSignInChange = (e) => {
    const { name, value } = e.target
    setSignInData(prev => ({ ...prev, [name]: value }))
  }

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { usernameOrEmail, password } = signInData;
      if (!usernameOrEmail.trim() || !password) {
        triggerToast("Authentication Failed", "Invalid username/email or password.", "error");
        setIsSubmitting(false);
        return;
      }

      const identifier = usernameOrEmail.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        triggerToast("Authentication Failed", "Invalid username/email or password.", "error");
        setIsSubmitting(false);
        return;
      }

      if (!data) {
        triggerToast("Authentication Failed", "Invalid username/email or password.", "error");
        setIsSubmitting(false);
        return;
      }

      if (data.role === 'admin') {
        localStorage.setItem('isAdminLoggedIn', 'true');
        setIsAdminLoggedIn(true);
        setIsDeveloperLoggedIn(false);
        setLoggedInDeveloper(null);
        closeModal();
        triggerToast(
          'Success!',
          'Signed in as Admin.',
          'success'
        );
        return;
      }

      if (data.role === 'developer') {
        if (data.status !== 'active') {
          triggerToast("Authentication Failed", "Invalid username/email or password.", "error");
          setIsSubmitting(false);
          return;
        }

        const mappedDev = {
          id: data.id,
          name: data.username,
          email: data.email,
          projectsCount: projectsData ? projectsData.filter(p => p.email.toLowerCase() === data.email.toLowerCase()).length : 0,
          status: 'Active'
        };

        localStorage.setItem('currentDeveloper', JSON.stringify(mappedDev));
        setIsDeveloperLoggedIn(true);
        setLoggedInDeveloper(mappedDev);
        setIsAdminLoggedIn(false);
        setDevActiveTab('home');
        closeModal();
        triggerToast("Success!", "Signed in successfully.", "success");
        return;
      }

      triggerToast("Authentication Failed", "Invalid username/email or password.", "error");
    } catch (err) {
      triggerToast("Authentication Failed", "Invalid username/email or password.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavLinkClick = (e, item) => {
    e.preventDefault()
    setActiveLink(item)
    const targetId = item.toLowerCase().replace(/\s+/g, '-')

    if (currentPage === 'projects') {
      window.history.pushState({}, '', '/')
      setCurrentPage('home')
      setTimeout(() => {
        const element = document.getElementById(targetId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
    } else {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMobileMenuOpen(false)
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    setActiveLink('Home')
    if (currentPage === 'projects') {
      navigateTo('home')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle navbar style change on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close Sign In and Visitor details modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal()
        setIsVisitorViewModalOpen(false)
        setSelectedReason(null)
        setDeleteContactTarget(null)
        setDeleteProjectTarget(null)
        setIsLogoutModalOpen(false)
        setIsClearAllNotificationsModalOpen(false)
        setIsAddDevModalOpen(false)
        setIsBulkImportModalOpen(false)
        setIsEditDevModalOpen(false)
        setIsResetPasswordModalOpen(false)
        setActiveActionMenuId(null)
      }
    }
    if (isSignInModalOpen || isVisitorViewModalOpen || selectedReason !== null || deleteContactTarget !== null || deleteProjectTarget !== null || isLogoutModalOpen || isClearAllNotificationsModalOpen || isAddDevModalOpen || isBulkImportModalOpen || isEditDevModalOpen || isResetPasswordModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSignInModalOpen, isVisitorViewModalOpen, selectedReason, deleteContactTarget, deleteProjectTarget, isLogoutModalOpen, isClearAllNotificationsModalOpen, isAddDevModalOpen, isBulkImportModalOpen, isEditDevModalOpen, isResetPasswordModalOpen])

  // Close action menu dropdown and project popover when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionMenuId(null)
      setActivePopoverProjectId(null)
      setProfileDropdownOpen(false)
      setAdminProfileDropdownOpen(false)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  // Close project popover and action menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      setActivePopoverProjectId(null)
      setActiveActionMenuId(null)
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  // Navigation items
  const navItems = ['Home', 'About', 'Contact Us']

  const handleEyeClick = (e, project) => {
    e.stopPropagation();
    if (activePopoverProjectId === project.id) {
      setActivePopoverProjectId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActivePopoverProjectId(project.id);
      setPopoverPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    }
  };

  if (isAdminLoggedIn) {
    return (
      <div className="admin-dashboard-container">
        {/* Background glowing elements */}
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />

        {/* Left Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-brand">
            <div className="logo-img-wrapper">
              <img src={logoImg} alt="Sydions Logo" className="logo-img" />
            </div>
            <span className="logo-text">Sydions Admin</span>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${adminActiveTab === 'home' ? 'active' : ''}`}
              onClick={() => changeAdminTab('home')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Home
            </button>
            <button
              className={`sidebar-nav-item ${adminActiveTab === 'projects' ? 'active' : ''}`}
              onClick={() => changeAdminTab('projects')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Projects
            </button>
            <button
              className={`sidebar-nav-item ${adminActiveTab === 'developers' ? 'active' : ''}`}
              onClick={() => changeAdminTab('developers')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Developers
            </button>
            <button
              className={`sidebar-nav-item ${adminActiveTab === 'contact-requests' ? 'active' : ''}`}
              onClick={() => changeAdminTab('contact-requests')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Contact Requests
            </button>
          </nav>
          <div className="sidebar-footer">
            <button
              className="sidebar-nav-item logout"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Dashboard Content Area */}
        <main className="admin-main">
          {/* Topbar */}
          <header className="admin-topbar">
            <h1 className="admin-page-title">
              {adminActiveTab === 'home' && "Dashboard Overview"}
              {adminActiveTab === 'projects' && "Project Management"}
              {adminActiveTab === 'developers' && "Developers"}
              {adminActiveTab === 'contact-requests' && "Contact Requests"}
            </h1>
            <div className="admin-topbar-actions">
              {/* Notification Bell */}
              <div className="notification-bell-container">
                <button className="notification-bell-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="bell-badge">{notifications.filter(n => !n.read).length}</span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="notifications-dropdown">
                    <div className="notifications-dropdown-header">
                      <h4>Notifications</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button onClick={handleMarkAllNotificationsAsRead} className="notif-action-btn">
                            Mark Read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={() => setIsClearAllNotificationsModalOpen(true)} className="notif-action-btn clear-all">
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notifications-dropdown-list">
                      {notifications.length === 0 ? (
                        <p className="no-notifications">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notification-item ${!n.read ? 'unread' : ''}`}
                            onClick={() => !n.read && handleMarkNotificationAsRead(n.id)}
                            style={{ cursor: !n.read ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                          >
                            <div style={{ flex: 1 }}>
                              <p className="notification-text">{n.text}</p>
                              <span className="notification-time">{n.time}</span>
                            </div>
                            <button
                              className="delete-notif-btn"
                              onClick={(e) => handleDeleteNotification(n.id, e)}
                              title="Delete notification"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Profile Dropdown */}
              <div
                className="admin-profile-container"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminProfileDropdownOpen(!adminProfileDropdownOpen);
                }}
                onMouseEnter={() => setAdminProfileDropdownOpen(true)}
                onMouseLeave={() => setAdminProfileDropdownOpen(false)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="admin-avatar">
                  A
                </div>
                {adminProfileDropdownOpen && (
                  <div className="admin-profile-dropdown fade-in">
                    <div className="dropdown-username">Admin User</div>
                    <div className="dropdown-email">admin@sydions.org</div>
                    <div className="dropdown-badge">Administrator</div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => setAdminActiveTab('home')}>
                      Dashboard Home
                    </button>
                    <button className="dropdown-item logout-item" onClick={() => setIsLogoutModalOpen(true)}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Home Tab */}
          {adminActiveTab === 'home' && (
            <div className="admin-tab-content fade-in">
              {/* Welcome Banner */}
              <div className="dev-welcome-banner glass-panel">
                <div className="dev-welcome-text-wrapper">
                  <h2>Welcome back, <span className="gradient-text-cyan">Admin</span></h2>
                  <p>Here is the current status of the Sydions Showcase registry. You can approve project submissions, manage developer profiles, and review contact messages.</p>
                </div>
                <div className="welcome-card-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="action-btn approve-btn"
                    onClick={() => {
                      setAdminActiveTab('projects');
                      setProjectsSubTab('active');
                    }}
                    style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Review Submissions
                  </button>
                  <button
                    className="action-btn view-btn"
                    onClick={() => setAdminActiveTab('contact-requests')}
                    style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Contact Messages
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card card-cyan">
                  <div className="stat-card-header">
                    <div className="stat-value">{projectsData.filter(p => p.status === 'approved').length}</div>
                    <div className="stat-icon-wrapper cyan">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-label">Approved Projects</div>
                </div>
                <div className="admin-stat-card card-green">
                  <div className="stat-card-header">
                    <div className="stat-value">{projectsData.filter(p => p.status === 'pending').length}</div>
                    <div className="stat-icon-wrapper green">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-label">Pending Projects</div>
                </div>
                <div className="admin-stat-card card-blue">
                  <div className="stat-card-header">
                    <div className="stat-value">{developersData.length}</div>
                    <div className="stat-icon-wrapper blue">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-label">Total Developers</div>
                </div>
                <div className="admin-stat-card card-red">
                  <div className="stat-card-header">
                    <div className="stat-value">{projectsData.filter(p => p.status === 'rejected').length}</div>
                    <div className="stat-icon-wrapper red">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-label">Rejected Projects</div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="glass-panel" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-cyan)' }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Recent System Activity
                </h3>

                <div className="activity-timeline">
                  {recentActivities.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No recent activity recorded.</p>
                  ) : (
                    recentActivities.map((act) => (
                      <div key={act.id} className="timeline-item">
                        <div className={`timeline-badge ${act.type}`}>
                          {act.type === 'project_submitted' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                          )}
                          {act.type === 'project_approved' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {act.type === 'project_rejected' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          )}
                          {act.type === 'contact_request' && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          )}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-title">{act.title}</span>
                            <span className="timeline-time">{act.dateStr}</span>
                          </div>
                          <p className="timeline-desc">{act.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {adminActiveTab === 'projects' && (
            <div className="admin-tab-content fade-in">
              {/* Nested tabs */}
              <div className="nested-tabs-container">
                <button
                  className={`nested-tab-btn ${projectsSubTab === 'active' ? 'active' : ''}`}
                  onClick={() => changeProjectsSubTab('active')}
                >
                  Active Projects ({projectsData.filter(p => p.status === 'pending').length})
                </button>
                <button
                  className={`nested-tab-btn ${projectsSubTab === 'approved' ? 'active' : ''}`}
                  onClick={() => changeProjectsSubTab('approved')}
                >
                  Approved Projects ({projectsData.filter(p => p.status === 'approved').length})
                </button>
                <button
                  className={`nested-tab-btn ${projectsSubTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => changeProjectsSubTab('rejected')}
                >
                  Rejected Projects ({projectsData.filter(p => p.status === 'rejected').length})
                </button>
              </div>

              {/* Active Projects (Pending Approval) */}
              {projectsSubTab === 'active' && (
                <>
                  {renderTableUtilities("Search pending projects...")}
                  <div className="table-responsive glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Project Title</th>
                          <th>Developer Name</th>
                          <th>Date/Time</th>
                          <th>Status</th>
                          <th className="actions-column">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAdminActiveProjects.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center no-data">No pending projects found</td>
                          </tr>
                        ) : (
                          paginatedAdminActiveProjects.map(p => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div className="project-title-cell-content">
                                  <span>{p.title}</span>
                                  <button
                                    type="button"
                                    className={`project-eye-btn ${activePopoverProjectId === p.id ? 'active' : ''}`}
                                    onClick={(e) => handleEyeClick(e, p)}
                                    title="View Project Details"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td>{p.developer}</td>
                              <td>{p.dateTime}</td>
                              <td>
                                <span className="status-badge pending">Pending</span>
                              </td>
                              <td className="actions-column">
                                <div className="action-buttons-cell">
                                  <button
                                    className="action-btn approve-btn"
                                    onClick={() => {
                                      const projsRaw = localStorage.getItem('sydions_projects');
                                      const currentProjs = projsRaw ? JSON.parse(projsRaw) : [];
                                      const updatedProjs = currentProjs.map(proj => proj.id === p.id ? { ...proj, status: 'approved' } : proj);
                                      localStorage.setItem('sydions_projects', JSON.stringify(updatedProjs));
                                      triggerToast("Approved", `Approved project '${p.title}'.`, "success");
                                      fetchAllData();
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="action-btn reject-btn"
                                    onClick={() => {
                                      setRejectionTargetProjectId(p.id)
                                      setRejectionReason('')
                                      setIsRejectionModalOpen(true)
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(pageAdminActiveProjects, filteredAdminActiveProjects.length, setPageAdminActiveProjects)}
                </>
              )}

              {/* Approved Projects */}
              {projectsSubTab === 'approved' && (
                <>
                  {renderTableUtilities("Search approved projects...")}
                  <div className="table-responsive glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Project Title</th>
                          <th>Developer Name</th>
                          <th>Date/Time</th>
                          <th>Status</th>
                          <th className="actions-column">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAdminApprovedProjects.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center no-data">No approved projects found</td>
                          </tr>
                        ) : (
                          paginatedAdminApprovedProjects.map(p => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div className="project-title-cell-content">
                                  <span>{p.title}</span>
                                  <button
                                    type="button"
                                    className={`project-eye-btn ${activePopoverProjectId === p.id ? 'active' : ''}`}
                                    onClick={(e) => handleEyeClick(e, p)}
                                    title="View Project Details"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td>{p.developer}</td>
                              <td>{p.dateTime}</td>
                              <td>
                                <span className="status-badge approved">Approved</span>
                              </td>
                              <td className="actions-column">
                                <div className="action-buttons-cell">
                                  <button
                                    className="action-btn view-btn"
                                    onClick={() => {
                                      setViewTargetProject(p)
                                      setIsViewModalOpen(true)
                                    }}
                                  >
                                    View
                                  </button>
                                  <button
                                    className="action-btn remove-btn"
                                    onClick={() => {
                                      const projsRaw = localStorage.getItem('sydions_projects');
                                      const currentProjs = projsRaw ? JSON.parse(projsRaw) : [];
                                      const updatedProjs = currentProjs.map(proj => proj.id === p.id ? { ...proj, status: 'pending' } : proj);
                                      localStorage.setItem('sydions_projects', JSON.stringify(updatedProjs));
                                      triggerToast("Removed", `Moved '${p.title}' back to Active Projects.`, "warning");
                                      fetchAllData();
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(pageAdminApprovedProjects, filteredAdminApprovedProjects.length, setPageAdminApprovedProjects)}
                </>
              )}

              {/* Rejected Projects */}
              {projectsSubTab === 'rejected' && (
                <>
                  {renderTableUtilities("Search rejected projects...")}
                  <div className="table-responsive glass-panel">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Project Title</th>
                          <th>Developer Name</th>
                          <th>Date/Time</th>
                          <th>Rejection Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAdminRejectedProjects.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center no-data">No rejected projects found</td>
                          </tr>
                        ) : (
                          paginatedAdminRejectedProjects.map(p => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                <div className="project-title-cell-content">
                                  <span>{p.title}</span>
                                  <button
                                    type="button"
                                    className={`project-eye-btn ${activePopoverProjectId === p.id ? 'active' : ''}`}
                                    onClick={(e) => handleEyeClick(e, p)}
                                    title="View Project Details"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td>{p.developer}</td>
                              <td>{p.dateTime}</td>
                              <td className="text-red-muted">{p.rejectionReason}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(pageAdminRejectedProjects, filteredAdminRejectedProjects.length, setPageAdminRejectedProjects)}
                </>
              )}
            </div>
          )}

          {/* Developers Tab */}
          {adminActiveTab === 'developers' && (
            <div className="admin-tab-content fade-in">
              <div className="developers-tab-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="action-btn approve-btn" onClick={() => {
                    setAddDevData({ username: '', email: '', password: '', confirmPassword: '', gender: 'Prefer Not To Say' })
                    setShowAddDevPassword(false)
                    setShowAddDevConfirmPassword(false)
                    setIsAddDevModalOpen(true)
                  }}>
                    + Add Developer
                  </button>
                  <button className="action-btn view-btn" onClick={() => setIsBulkImportModalOpen(true)}>
                    + Bulk Import
                  </button>
                </div>
              </div>

              {renderTableUtilities("Search developers...")}

              <div className="table-responsive glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Gender</th>
                      <th>Projects Submitted</th>
                      <th>Status</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAdminDevs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center no-data">No developers found</td>
                      </tr>
                    ) : (
                      paginatedAdminDevs.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                          <td>{d.email}</td>
                          <td>
                            <span className={`gender-badge ${d.gender ? d.gender.toLowerCase().replace(/\s+/g, '-') : 'prefer-not-to-say'}`}>
                              {d.gender || 'Prefer Not To Say'}
                            </span>
                          </td>
                          <td>{d.projectsCount}</td>
                          <td>
                            <span className={`status-badge ${d.status === 'Active' ? 'approved' : 'rejected'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="actions-column">
                            <div className="action-buttons-cell">
                              <button
                                className={`three-dots-btn ${activeActionMenuId === d.id ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeActionMenuId === d.id) {
                                    setActiveActionMenuId(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveActionMenuId(d.id);
                                    setActionMenuPosition({
                                      top: rect.bottom + 6,
                                      left: rect.right - 160
                                    });
                                  }
                                }}
                                title="Actions"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(pageAdminDevs, filteredAdminDevs.length, setPageAdminDevs)}
            </div>
          )}

          {/* Contact Requests Tab */}
          {adminActiveTab === 'contact-requests' && (
            <div className="admin-tab-content fade-in">
              {renderTableUtilities("Search contact requests...")}

              <div className="table-responsive glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Reason</th>
                      <th>Created At</th>
                      <th className="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAdminContacts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center no-data" style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                          No contact requests found.
                        </td>
                      </tr>
                    ) : (
                      paginatedAdminContacts.map((req) => (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.name || req.full_name || 'N/A'}</td>
                          <td>
                            {req.email ? (
                              <a href={`mailto:${req.email}`} style={{ color: 'var(--accent-cyan)' }}>
                                {req.email}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{req.phone || 'N/A'}</td>
                          <td>
                            {req.reason ? (
                              <button
                                type="button"
                                className="project-eye-btn"
                                onClick={() => setSelectedReason(req.reason)}
                                title="View Reason"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            {req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="actions-column">
                            <div className="action-buttons-cell">
                              <button
                                className="action-btn reject-btn"
                                onClick={() => setDeleteContactTarget(req)}
                                title="Delete Contact Request"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(pageAdminContacts, filteredAdminContacts.length, setPageAdminContacts)}
            </div>
          )}
        </main>

        {/* Logout Confirmation Modal Popup */}
        {isLogoutModalOpen && (
          <div className="signin-modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsLogoutModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold">Sign Out</h2>
                <p className="modal-subtitle">Are you sure you want to sign out?</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', margin: 0 }}
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn btn-reject"
                  style={{ margin: 0 }}
                  onClick={() => {
                    localStorage.removeItem('isAdminLoggedIn')
                    setIsAdminLoggedIn(false)
                    window.location.href = '/'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Reason Modal Popup */}
        {selectedReason !== null && (
          <div className="signin-modal-overlay" onClick={() => setSelectedReason(null)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setSelectedReason(null)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold">Contact Reason</h2>
              </div>
              <div className="contact-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', lineHeight: '1.6', color: 'var(--text-primary)', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                    {selectedReason || "No reason provided."}
                  </div>
                </div>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn"
                  onClick={() => setSelectedReason(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Contact Request Confirmation Modal Popup */}
        {deleteContactTarget && (
          <div className="signin-modal-overlay" onClick={() => setDeleteContactTarget(null)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setDeleteContactTarget(null)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Delete Contact Request</h2>
                <p className="modal-subtitle">Are you sure you want to delete the contact request from "{deleteContactTarget.name || deleteContactTarget.full_name || 'N/A'}"? This action cannot be undone.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn btn-reject"
                  onClick={async () => {
                    const { error } = await supabase
                      .from('contact_messages')
                      .delete()
                      .eq('id', deleteContactTarget.id);
                    if (error) {
                      triggerToast("Error", error.message);
                    } else {
                      triggerToast("Deleted", "Contact request has been deleted.");
                      fetchAllData();
                    }
                    setDeleteContactTarget(null);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  onClick={() => setDeleteContactTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Developer Confirmation Modal Popup */}
        {deleteConfirmTarget && (
          <div className="signin-modal-overlay" onClick={() => setDeleteConfirmTarget(null)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setDeleteConfirmTarget(null)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Delete Developer</h2>
                <p className="modal-subtitle">Are you sure you want to delete developer "{deleteConfirmTarget.name}"? This action cannot be undone.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn btn-reject"
                  onClick={async () => {
                    const { error } = await supabase
                      .from('profiles')
                      .delete()
                      .eq('id', deleteConfirmTarget.id);
                    if (error) {
                      triggerToast("Error", error.message);
                    } else {
                      triggerToast("Deleted", `Developer '${deleteConfirmTarget.name}' has been deleted.`);
                      fetchAllData();
                    }
                    setDeleteConfirmTarget(null);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  onClick={() => setDeleteConfirmTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal Popup */}
        {isRejectionModalOpen && (
          <div className="signin-modal-overlay" onClick={() => setIsRejectionModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsRejectionModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Reject Project</h2>
                <p className="modal-subtitle">Provide a rejection reason for this project submission.</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!rejectionReason.trim()) return
                  const projsRaw = localStorage.getItem('sydions_projects');
                  const currentProjs = projsRaw ? JSON.parse(projsRaw) : [];
                  const updatedProjs = currentProjs.map(proj => proj.id === rejectionTargetProjectId ? { ...proj, status: 'rejected', rejectionReason: rejectionReason } : proj);
                  localStorage.setItem('sydions_projects', JSON.stringify(updatedProjs));
                  setIsRejectionModalOpen(false);
                  triggerToast("Rejected", "Project submission rejected.");
                  fetchAllData();
                }}
                className="contact-form"
              >
                <div className="form-group">
                  <label htmlFor="rejection-reason-input" className="form-label">Reason</label>
                  <textarea
                    id="rejection-reason-input"
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason here..."
                    rows="4"
                    className="form-input form-textarea"
                  />
                </div>
                <button type="submit" className="form-submit-btn large-gradient-btn btn-reject">
                  Reject Submission
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Project Details Modal Popup */}
        {isViewModalOpen && viewTargetProject && (
          <div className="signin-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
            <div className="signin-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsViewModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <span className="project-category-tag" style={{
                  background: 'rgba(0, 242, 254, 0.1)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>{viewTargetProject.category}</span>
                <h2 className="modal-title">{viewTargetProject.title}</h2>
                <p className="modal-subtitle">Submitted by {viewTargetProject.developer} on {viewTargetProject.dateTime}</p>
              </div>
              <div className="project-view-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Description</h4>
                  <p style={{ lineHeight: '1.6', fontSize: '14.5px' }}>{viewTargetProject.description}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Technologies Used</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {viewTargetProject.tags.map(tag => (
                      <span key={tag} className="project-tag-item">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Contact Details</h4>
                  <p style={{ fontSize: '14px' }}>Email: <a href={`mailto:${viewTargetProject.email}`} style={{ color: 'var(--accent-cyan)' }}>{viewTargetProject.email}</a></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Developer Modal Popup */}
        {isAddDevModalOpen && (
          <div className="signin-modal-overlay" onClick={() => setIsAddDevModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsAddDevModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold">Add New Developer</h2>
                <p className="modal-subtitle">Create a new developer account.</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!addDevData.username.trim() || !addDevData.email.trim() || !addDevData.password) return;
                  if (addDevData.password !== addDevData.confirmPassword) {
                    triggerToast("Error", "Passwords do not match.", "error");
                    return;
                  }
                  if (addDevData.password.length < 8) {
                    triggerToast("Error", "Password must be at least 8 characters long.", "error");
                    return;
                  }

                  try {
                    const { data: existingDevs, error: checkError } = await supabase
                      .from('profiles')
                      .select('id')
                      .or(`username.ilike.${addDevData.username.trim()},email.ilike.${addDevData.email.trim()}`);

                    if (existingDevs && existingDevs.length > 0) {
                      triggerToast("Error", "Username or Email already registered.", "error");
                      return;
                    }

                    const { error: insertError } = await supabase
                      .from('profiles')
                      .insert([
                        {
                          id: crypto.randomUUID(),
                          username: addDevData.username.trim(),
                          email: addDevData.email.trim(),
                          password: addDevData.password,
                          role: 'developer',
                          status: 'active',
                          gender: addDevData.gender || 'Prefer Not To Say'
                        }
                      ]);
                    if (insertError) {
                      triggerToast("Error", insertError.message, "error");
                      return;
                    }

                    setIsAddDevModalOpen(false);
                    setAddDevData({ username: '', email: '', password: '', confirmPassword: '', gender: 'Prefer Not To Say' });
                    triggerToast("Success!", `Developer '${addDevData.username.trim()}' created successfully.`, "success");
                    fetchAllData();
                  } catch (err) {
                    triggerToast("Error", "An unexpected error occurred.", "error");
                  } 
                }}
                className="contact-form"
              >
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    required
                    value={addDevData.username}
                    onChange={(e) => setAddDevData({ ...addDevData, username: e.target.value })}
                    placeholder="Enter username"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addDevData.email}
                    onChange={(e) => setAddDevData({ ...addDevData, email: e.target.value })}
                    placeholder="Enter email"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showAddDevPassword ? "text" : "password"}
                      required
                      value={addDevData.password}
                      onChange={(e) => setAddDevData({ ...addDevData, password: e.target.value })}
                      placeholder="At least 8 characters"
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddDevPassword(!showAddDevPassword)}
                      className="password-toggle-btn"
                      aria-label={showAddDevPassword ? "Hide password" : "Show password"}
                    >
                      {showAddDevPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showAddDevConfirmPassword ? "text" : "password"}
                      required
                      value={addDevData.confirmPassword}
                      onChange={(e) => setAddDevData({ ...addDevData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddDevConfirmPassword(!showAddDevConfirmPassword)}
                      className="password-toggle-btn"
                      aria-label={showAddDevConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showAddDevConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="add-dev-gender" className="form-label">Gender *</label>
                  <select
                    id="add-dev-gender"
                    required
                    value={addDevData.gender || 'Prefer Not To Say'}
                    onChange={(e) => setAddDevData({ ...addDevData, gender: e.target.value })}
                    className="form-input"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', height: '46px', borderRadius: '8px', padding: '0 12px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer Not To Say">Prefer Not To Say</option>
                  </select>
                </div>
                <button type="submit" className="form-submit-btn large-gradient-btn">
                  Create Developer
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Import Modal Popup */}
        {isBulkImportModalOpen && (
          <div className="signin-modal-overlay" onClick={() => setIsBulkImportModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsBulkImportModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold">Bulk Import Developers</h2>
                <p className="modal-subtitle">Upload a CSV file with columns: <strong>Username, Email, Password</strong>.</p>
              </div>
              <div style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="form-input"
                    style={{ padding: '8px' }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        const text = evt.target.result;
                        const lines = text.split('\n');
                        let successCount = 0;
                        let skipCount = 0;

                        triggerToast("Importing...", "Starting bulk import of developers.");

                        for (let i = 1; i < lines.length; i++) {
                          const line = lines[i].trim();
                          if (!line) continue;

                          const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                          if (parts.length >= 3) {
                            const [username, email, password] = parts;
                            if (username && email && password) {
                              try {
                                const { error: insertError } = await supabase
                                  .from('profiles')
                                  .insert({
                                    username: username,
                                    email: email,
                                    password: password,
                                    role: 'developer',
                                    status: 'active'
                                  });

                                if (insertError) {
                                  skipCount++;
                                } else {
                                  successCount++;
                                }
                              } catch (err) {
                                skipCount++;
                              }
                            } else {
                              skipCount++;
                            }
                          } else {
                            skipCount++;
                          }
                        }

                        triggerToast("Import Complete", `Successfully imported ${successCount} developers. (Skipped ${skipCount} errors/duplicates).`);
                        setIsBulkImportModalOpen(false);
                        fetchAllData();
                      };
                      reader.readAsText(file);
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '10px' }}>
                  <strong>CSV Format Example:</strong><br />
                  <code>
                    Username, Email, Password<br />
                    john_doe, john@sydions.org, password123<br />
                    jane_smith, jane@sydions.org, pass456
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Developer Modal Popup */}
        {isEditDevModalOpen && editDevTarget && (
          <div className="signin-modal-overlay" onClick={() => setIsEditDevModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsEditDevModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold">Edit Developer</h2>
                <p className="modal-subtitle">Update details for {editDevTarget.name}.</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editDevData.username.trim() || !editDevData.email.trim()) return;

                  try {
                    const { data: existingDevs, error: checkError } = await supabase
                      .from('developers')
                      .select('id')
                      .or(`name.ilike.${editDevData.username.trim()},email.ilike.${editDevData.email.trim()}`);

                    const exists = existingDevs && existingDevs.some(dev => dev.id !== editDevTarget.id);

                    if (exists) {
                      triggerToast("Error", "Username or Email already registered.");
                      return;
                    }

                    const { error } = await supabase
                      .from('profiles')
                      .update({
                        username: editDevData.username.trim(),
                        email: editDevData.email.trim()
                      })
                      .eq('id', editDevTarget.id);

                    if (error) {
                      triggerToast("Error", error.message);
                      return;
                    }

                    setIsEditDevModalOpen(false);
                    setEditDevTarget(null);
                    triggerToast("Success!", "Developer details updated.");
                    fetchAllData();
                  } catch (err) {
                    triggerToast("Error", "An unexpected error occurred.");
                  }
                }}
                className="contact-form"
              >
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    required
                    value={editDevData.username}
                    onChange={(e) => setEditDevData({ ...editDevData, username: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editDevData.email}
                    onChange={(e) => setEditDevData({ ...editDevData, email: e.target.value })}
                    className="form-input"
                  />
                </div>
                <button type="submit" className="form-submit-btn large-gradient-btn">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal Popup */}
        {isResetPasswordModalOpen && resetPasswordTarget && (
          <div className="signin-modal-overlay" onClick={() => setIsResetPasswordModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsResetPasswordModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Reset Password</h2>
                <p className="modal-subtitle">Reset password for {resetPasswordTarget.name}.</p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!resetPasswordData.password) return;
                  if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
                    triggerToast("Error", "Passwords do not match.");
                    return;
                  }
                  if (resetPasswordData.password.length < 8) {
                    triggerToast("Error", "Password must be at least 8 characters long.");
                    return;
                  }

                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ password: resetPasswordData.password })
                      .eq('id', resetPasswordTarget.id);

                    if (error) {
                      triggerToast("Error", error.message);
                      return;
                    }

                    setIsResetPasswordModalOpen(false);
                    setResetPasswordTarget(null);
                    triggerToast("Success!", `Password has been reset for developer '${resetPasswordTarget.name}'.`);
                  } catch (err) {
                    triggerToast("Error", "An unexpected error occurred.");
                  }
                }}
                className="contact-form"
              >
                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    required
                    value={resetPasswordData.password}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="form-input"
                  />
                </div>
                <button type="submit" className="form-submit-btn large-gradient-btn btn-reject">
                  Reset Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Project Details Popover */}
        {activePopoverProjectId && (() => {
          const p = projectsData.find(proj => proj.id === activePopoverProjectId);
          if (!p) return null;

          return (
            <div
              className="project-minimal-popover"
              style={{
                position: 'fixed',
                top: popoverPosition.top,
                left: popoverPosition.left,
                transform: 'translate(-50%, -100%)',
                zIndex: 99999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {p.thumbnail && (
                <div className="popover-thumbnail">
                  <img src={p.thumbnail} alt={p.title} />
                </div>
              )}
              <div className="popover-header">
                <span className="popover-category" style={{
                  background: p.category === 'AI' ? 'rgba(16, 185, 129, 0.1)' : p.category === 'Cybersecurity' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 242, 254, 0.1)',
                  color: p.category === 'AI' ? 'var(--accent-green-bright)' : p.category === 'Cybersecurity' ? 'var(--accent-blue)' : 'var(--accent-cyan)',
                  border: p.category === 'AI' ? '1px solid rgba(16, 185, 129, 0.2)' : p.category === 'Cybersecurity' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(0, 242, 254, 0.2)',
                }}>{p.category}</span>
                <span className="popover-date">{p.dateTime}</span>
              </div>
              <h4 className="popover-title">{p.title}</h4>
              <p className="popover-desc">{p.description}</p>
              {p.tags && p.tags.length > 0 && (
                <div className="popover-tags">
                  {p.tags.map((tag, idx) => (
                    <span key={idx} className="popover-tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="popover-footer">
                <span className="popover-author">By {p.developer}</span>
                {p.demoLink && (
                  <a
                    href={sanitizeUrl(p.demoLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="popover-demo-link"
                  >
                    Demo Link
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* Clear All Notifications Confirmation Modal */}
        {isClearAllNotificationsModalOpen && (
          <div className="signin-modal-overlay" onClick={() => setIsClearAllNotificationsModalOpen(false)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsClearAllNotificationsModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Clear Notifications</h2>
                <p className="modal-subtitle">Are you sure you want to delete all notifications? This action cannot be undone.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', margin: 0 }}
                  onClick={() => setIsClearAllNotificationsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn btn-reject"
                  style={{ margin: 0 }}
                  onClick={handleClearAllNotifications}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Menu dropdown overlay */}
        {activeActionMenuId && (() => {
          const d = developersData.find(dev => dev.id === activeActionMenuId);
          if (!d) return null;
          return (
            <div
              className="vertical-action-buttons-floating"
              style={{
                position: 'fixed',
                top: actionMenuPosition.top,
                left: actionMenuPosition.left,
                zIndex: 99999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="dropdown-item-action"
                onClick={() => {
                  setEditDevTarget(d)
                  setEditDevData({ username: d.name, email: d.email })
                  setIsEditDevModalOpen(true)
                  setActiveActionMenuId(null)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <button
                className="dropdown-item-action"
                onClick={() => {
                  setResetPasswordTarget(d)
                  setResetPasswordData({ password: '', confirmPassword: '' })
                  setIsResetPasswordModalOpen(true)
                  setActiveActionMenuId(null)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Reset Password
              </button>
              <button
                className="dropdown-item-action"
                onClick={async () => {
                  const newStatus = d.status === 'Active' ? 'Disabled' : 'Active';
                  const newDbStatus = newStatus === 'Active' ? 'active' : 'disabled';
                  const { error } = await supabase
                    .from('profiles')
                    .update({ status: newDbStatus })
                    .eq('id', d.id);
                  if (error) {
                    triggerToast("Error", error.message, "error");
                  } else {
                    triggerToast(newStatus === 'Active' ? 'Enabled' : 'Disabled', `Developer '${d.name}' account is ${newStatus.toLowerCase()}.`, "success");
                    fetchAllData();
                  }
                  setActiveActionMenuId(null);
                }}
              >
                {d.status === 'Active' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Disable
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Enable
                  </>
                )}
              </button>
              <button
                className="dropdown-item-action delete-item"
                onClick={() => {
                  setDeleteConfirmTarget(d)
                  setActiveActionMenuId(null)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            </div>
          );
        })()}

        {/* Fixed bottom-right toast notification */}
        {showToast && (
          <div className={`toast-notification-fixed toast-${toastType}`}>
            <div className="toast-icon">
              {toastType === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {toastType === 'warning' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="toast-title">{toastTitle}</h4>
              <p className="toast-desc">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Developer Dashboard Helper Rendering Functions
  const openSubmitModal = () => {
    setSubmitForm({
      title: '',
      description: '',
      domain: 'AI',
      demoLink: '',
      builtBy: loggedInDeveloper ? loggedInDeveloper.name : '',
      technologiesUsed: '',
      thumbnail: ''
    });
    setIsSubmitModalOpen(true);
  };

  const handleDevProjectSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.title.trim() || !submitForm.description.trim()) {
      triggerToast("Error", "Please fill in all required fields.");
      return;
    }

    const color = submitForm.domain === 'AI' ? 'green' :
      submitForm.domain === 'Cybersecurity' ? 'blue' : 'cyan';

    try {
      const projsRaw = localStorage.getItem('sydions_projects');
      const currentProjs = projsRaw ? JSON.parse(projsRaw) : [];
      const newProj = {
        id: Date.now(),
        title: submitForm.title,
        category: submitForm.domain || 'Web Development',
        description: submitForm.description,
        tags: submitForm.technologiesUsed.split(',').map(t => t.trim()).filter(Boolean),
        color: color,
        developer: submitForm.builtBy || loggedInDeveloper.name,
        email: loggedInDeveloper.email,
        dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'pending',
        rejectionReason: '',
        demoLink: submitForm.demoLink,
        thumbnail: submitForm.thumbnail || ''
      };
      currentProjs.unshift(newProj);
      localStorage.setItem('sydions_projects', JSON.stringify(currentProjs));

      // Create Notification in database & local storage fallback
      const notifText = `New project '${submitForm.title}' submitted by ${submitForm.builtBy || loggedInDeveloper.name}`;
      try {
        const { error: dbNotifErr } = await supabase
          .from('notifications')
          .insert({
            text: notifText,
            time_text: 'Just now',
            is_read: false
          });
        if (dbNotifErr) throw dbNotifErr;
      } catch (err) {
        console.warn("Could not insert notification to Supabase, writing to local storage.", err.message);
        const notifsRaw = localStorage.getItem('sydions_notifications');
        const currentNotifs = notifsRaw ? JSON.parse(notifsRaw) : [];
        const newNotif = {
          id: Date.now(),
          text: notifText,
          time: "Just now",
          read: false
        };
        currentNotifs.unshift(newNotif);
        localStorage.setItem('sydions_notifications', JSON.stringify(currentNotifs));
      }

      setSubmitForm({
        title: '',
        description: '',
        domain: 'AI',
        demoLink: '',
        builtBy: loggedInDeveloper ? loggedInDeveloper.name : '',
        technologiesUsed: '',
        thumbnail: ''
      });

      setIsSubmitModalOpen(false);
      setDevActiveTab('projects');
      triggerToast("Submitted", "Your project has been submitted for admin review.");
      fetchAllData();
    } catch (err) {
      triggerToast("Error", "An unexpected error occurred during project submission.");
    }
  };

  const renderDevHome = () => {
    const devProjects = projectsData.filter(p => p.developer.toLowerCase() === loggedInDeveloper.name.toLowerCase());
    const submittedCount = devProjects.length;
    const publishedCount = devProjects.filter(p => p.status === 'approved').length;

    return (
      <div className="admin-tab-content fade-in">
        <div className="dev-welcome-banner glass-panel">
          <div className="dev-welcome-text-wrapper">
            <h2>Welcome back, <span className="gradient-text-cyan">{loggedInDeveloper.name}</span></h2>
            <p>Manage your projects, submit new innovation proposals, and check feedback from administrators.</p>
          </div>
          <button
            type="button"
            className="hero-cta-btn submit-project-btn"
            onClick={openSubmitModal}
          >
            <svg className="btn-plus-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--bg-dark)' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Submit Project
          </button>
        </div>

        <div className="admin-stats-grid dev-home-grid">
          <div className="admin-stat-card card-blue dev-home-card">
            <div className="stat-card-header">
              <div className="stat-value gradient-text-blue">{submittedCount}</div>
              <div className="stat-icon-wrapper blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>
            <div className="stat-label">Projects Submitted</div>
            <p className="card-description">Total number of projects submitted to the Sydions Showcase registry.</p>
          </div>
          <div className="admin-stat-card card-cyan dev-home-card">
            <div className="stat-card-header">
              <div className="stat-value gradient-text-cyan">{publishedCount}</div>
              <div className="stat-icon-wrapper cyan">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            </div>
            <div className="stat-label">Projects Published</div>
            <p className="card-description">Number of projects approved and live on the public showcase catalog.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDevProjects = () => {
    const devProjects = projectsData.filter(p => p.developer.toLowerCase() === loggedInDeveloper.name.toLowerCase());
    const pendingProjects = devProjects.filter(p => p.status === 'pending');
    const approvedProjects = devProjects.filter(p => p.status === 'approved');
    const rejectedProjects = devProjects.filter(p => p.status === 'rejected');

    const handleCopyPublicLink = (project) => {
      const publicLink = `${window.location.origin}/projects?id=${project.id}`;
      navigator.clipboard.writeText(publicLink)
        .then(() => {
          triggerToast("Copied!", "Project link copied to clipboard.");
        })
        .catch(() => {
          triggerToast("Error", "Could not copy link.");
        });
    };

    return (
      <div className="admin-tab-content fade-in">
        <div className="nested-tabs-container">
          <button
            className={`nested-tab-btn ${devProjectsSubTab === 'pending' ? 'active' : ''}`}
            onClick={() => changeDevProjectsSubTab('pending')}
          >
            Pending ({pendingProjects.length})
          </button>
          <button
            className={`nested-tab-btn ${devProjectsSubTab === 'approved' ? 'active' : ''}`}
            onClick={() => changeDevProjectsSubTab('approved')}
          >
            Approved ({approvedProjects.length})
          </button>
          <button
            className={`nested-tab-btn ${devProjectsSubTab === 'rejected' ? 'active' : ''}`}
            onClick={() => changeDevProjectsSubTab('rejected')}
          >
            Rejected ({rejectedProjects.length})
          </button>
        </div>

        {devProjectsSubTab === 'pending' && (
          <>
            {renderTableUtilities("Search pending projects...")}
            <div className="table-responsive glass-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Project Title</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevPendingProjects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center no-data">No pending projects found.</td>
                    </tr>
                  ) : (
                    paginatedDevPendingProjects.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{p.title}</span>
                            <button
                              type="button"
                              className="dev-preview-icon-btn"
                              onClick={() => {
                                setViewTargetProject(p);
                                setIsViewModalOpen(true);
                              }}
                              title="Preview Project Details"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                background: 'transparent',
                                transition: 'all var(--transition-fast)'
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td>{p.dateTime}</td>
                        <td>
                          <span className="status-badge pending">Pending</span>
                        </td>
                        <td className="actions-column">
                          <div className="action-buttons-cell">
                            <button
                              className="action-btn reject-btn"
                              onClick={() => setDeleteProjectTarget(p)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(pageDevPendingProjects, filteredDevPendingProjects.length, setPageDevPendingProjects)}
          </>
        )}

        {devProjectsSubTab === 'approved' && (
          <>
            {renderTableUtilities("Search approved projects...")}
            <div className="table-responsive glass-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Project Title</th>
                    <th>Published Date</th>
                    <th>Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevApprovedProjects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center no-data">No approved projects found.</td>
                    </tr>
                  ) : (
                    paginatedDevApprovedProjects.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{p.title}</span>
                            <button
                              type="button"
                              className="dev-preview-icon-btn"
                              onClick={() => {
                                setViewTargetProject(p);
                                setIsViewModalOpen(true);
                              }}
                              title="Preview Project Details"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                background: 'transparent',
                                transition: 'all var(--transition-fast)'
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td>{p.dateTime}</td>
                        <td>
                          <span className="status-badge approved">Approved</span>
                        </td>
                        <td className="actions-column">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleCopyPublicLink(p)}
                          >
                            Copy Public Link
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(pageDevApprovedProjects, filteredDevApprovedProjects.length, setPageDevApprovedProjects)}
          </>
        )}

        {devProjectsSubTab === 'rejected' && (
          <>
            {renderTableUtilities("Search rejected projects...")}
            <div className="table-responsive glass-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Project Title</th>
                    <th>Date/Time</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDevRejectedProjects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center no-data">No rejected projects found.</td>
                    </tr>
                  ) : (
                    paginatedDevRejectedProjects.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{p.title}</span>
                            <button
                              type="button"
                              className="dev-preview-icon-btn"
                              onClick={() => {
                                setViewTargetProject(p);
                                setIsViewModalOpen(true);
                              }}
                              title="Preview Project Details"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                background: 'transparent',
                                transition: 'all var(--transition-fast)'
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td>{p.dateTime}</td>
                        <td>
                          <span className="status-badge rejected">Rejected</span>
                        </td>
                        <td>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => setViewReasonProject(p)}
                            title="View Rejection Reason"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            View Reason
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(pageDevRejectedProjects, filteredDevRejectedProjects.length, setPageDevRejectedProjects)}
          </>
        )}
      </div>
    );
  };

  if (isDeveloperLoggedIn && loggedInDeveloper) {
    return (
      <div className="admin-dashboard-container developer-dashboard-container">
        <div className="glow-orb-1" />
        <div className="glow-orb-2" />

        {/* Left Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-brand">
            <div className="logo-img-wrapper">
              <img src={logoImg} alt="Sydions Logo" className="logo-img" />
            </div>
            <span className="logo-text">Sydions DevHub</span>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${devActiveTab === 'home' ? 'active' : ''}`}
              onClick={() => changeDevTab('home')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Home
            </button>
            <button
              className={`sidebar-nav-item ${devActiveTab === 'projects' ? 'active' : ''}`}
              onClick={() => changeDevTab('projects')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Projects
            </button>
          </nav>
          <div className="sidebar-footer">
            <button
              className="sidebar-nav-item logout"
              onClick={() => {
                localStorage.removeItem('currentDeveloper');
                setIsDeveloperLoggedIn(false);
                setLoggedInDeveloper(null);
                window.location.href = '/'
              }}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">
          {/* Topbar */}
          <header className="admin-topbar">
            <h1 className="admin-page-title">
              {devActiveTab === 'home' && "Developer Portal"}
              {devActiveTab === 'projects' && "My Submitted Projects"}
            </h1>
            <div className="admin-topbar-actions">
              {/* Profile Avatar with dropdown tooltip */}
              <div
                className="dev-profile-container"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
                onMouseEnter={() => setProfileDropdownOpen(true)}
                onMouseLeave={() => setProfileDropdownOpen(false)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="dev-avatar">
                  {loggedInDeveloper.name ? loggedInDeveloper.name.charAt(0).toUpperCase() : 'D'}
                </div>
                {profileDropdownOpen && (
                  <div className="dev-profile-dropdown fade-in">
                    <div className="dropdown-username">{loggedInDeveloper.name}</div>
                    <div className="dropdown-email">{loggedInDeveloper.email}</div>
                    <div className="dropdown-badge">Developer</div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => setDevActiveTab('home')}>
                      Portal Home
                    </button>
                    <button className="dropdown-item" onClick={() => setDevActiveTab('projects')}>
                      My Projects
                    </button>
                    <button className="dropdown-item" onClick={openSubmitModal}>
                      Submit Project
                    </button>
                    <button
                      className="dropdown-item logout-item"
                      onClick={() => {
                        localStorage.removeItem('currentDeveloper');
                        setIsDeveloperLoggedIn(false);
                        setLoggedInDeveloper(null);
                        window.location.href = '/'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Render tabs content */}
          {devActiveTab === 'home' && renderDevHome()}
          {devActiveTab === 'projects' && renderDevProjects()}
        </main>

        {/* Submit Project Modal */}
        {isSubmitModalOpen && (
          <div className="signin-modal-overlay" onClick={() => setIsSubmitModalOpen(false)}>
            <div className="signin-modal-card modal-scrollable" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsSubmitModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title">Submit Project</h2>
                <p className="modal-subtitle">Propose your project for the Sydions Showcase</p>
              </div>
              <form onSubmit={handleDevProjectSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-proj-title" className="form-label">Title *</label>
                    <input
                      type="text"
                      id="modal-proj-title"
                      required
                      value={submitForm.title}
                      onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                      placeholder="Enter project title"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-proj-domain" className="form-label">Domain *</label>
                    <select
                      id="modal-proj-domain"
                      value={submitForm.domain}
                      onChange={(e) => setSubmitForm({ ...submitForm, domain: e.target.value })}
                      className="form-input"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', height: '46px', borderRadius: '8px', padding: '0 12px' }}
                    >
                      <option value="AI">Artificial Intelligence (AI)</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="IoT">Internet of Things (IoT)</option>
                      <option value="Web Development">Web Development</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-proj-demo" className="form-label">Demo Link</label>
                    <input
                      type="url"
                      id="modal-proj-demo"
                      value={submitForm.demoLink}
                      onChange={(e) => setSubmitForm({ ...submitForm, demoLink: e.target.value })}
                      placeholder="https://example.com/demo"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-proj-builtby" className="form-label">Built By *</label>
                    <input
                      type="text"
                      id="modal-proj-builtby"
                      required
                      value={submitForm.builtBy}
                      onChange={(e) => setSubmitForm({ ...submitForm, builtBy: e.target.value })}
                      placeholder="e.g. Alex Rivera"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-proj-tech" className="form-label">Technologies Used (Comma-separated) *</label>
                  <input
                    type="text"
                    id="modal-proj-tech"
                    required
                    value={submitForm.technologiesUsed}
                    onChange={(e) => setSubmitForm({ ...submitForm, technologiesUsed: e.target.value })}
                    placeholder="e.g. React, Node.js, Python, OpenCV"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-proj-desc" className="form-label">Description *</label>
                  <textarea
                    id="modal-proj-desc"
                    required
                    rows="4"
                    value={submitForm.description}
                    onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                    placeholder="Briefly describe the project goals, implementation, and features..."
                    className="form-input form-textarea"
                  />
                </div>

                {/* Thumbnail Image Upload */}
                <div className="form-group">
                  <label className="form-label">Thumbnail Upload</label>
                  <div className="cyber-file-upload-wrapper">
                    <input
                      type="file"
                      id="modal-proj-thumbnail"
                      accept="image/*"
                      className="cyber-file-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setSubmitForm({ ...submitForm, thumbnail: evt.target.result });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label htmlFor="modal-proj-thumbnail" className="cyber-file-upload-label">
                      {submitForm.thumbnail ? (
                        <div className="cyber-upload-preview">
                          <img src={submitForm.thumbnail} alt="Thumbnail Preview" className="uploaded-thumbnail-preview" />
                          <span>Change Image</span>
                        </div>
                      ) : (
                        <div className="cyber-upload-placeholder">
                          <svg className="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>Click or Drag to Upload Thumbnail</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <button type="submit" className="form-submit-btn large-gradient-btn">
                  Submit Project
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Rejection Reason Modal */}
        {viewReasonProject && (
          <div className="signin-modal-overlay" onClick={() => setViewReasonProject(null)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setViewReasonProject(null)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Rejection Feedback</h2>
                <p className="modal-subtitle">Feedback for "{viewReasonProject.title}"</p>
              </div>
              <div className="contact-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#ef4444' }}>Reason for Rejection</label>
                  <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '8px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    {viewReasonProject.rejectionReason || "No rejection reason provided by admin."}
                  </div>
                </div>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn btn-reject"
                  onClick={() => setViewReasonProject(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        {deleteProjectTarget && (
          <div className="signin-modal-overlay" onClick={() => setDeleteProjectTarget(null)}>
            <div className="signin-modal-card modal-small" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setDeleteProjectTarget(null)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <h2 className="modal-title font-semibold text-red">Delete Project</h2>
                <p className="modal-subtitle">Are you sure you want to delete this project?</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn btn-reject"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('projects')
                        .delete()
                        .eq('id', deleteProjectTarget.id);

                      if (error) {
                        triggerToast("Error", error.message);
                      } else {
                        // Remove from local storage array as well
                        const projsRaw = localStorage.getItem('sydions_projects');
                        const currentProjs = projsRaw ? JSON.parse(projsRaw) : [];
                        const updatedProjs = currentProjs.filter(proj => proj.id !== deleteProjectTarget.id);
                        localStorage.setItem('sydions_projects', JSON.stringify(updatedProjs));

                        triggerToast("Deleted", "Project has been permanently deleted.");
                        fetchAllData();
                      }
                    } catch (err) {
                      triggerToast("Error", "An unexpected error occurred.");
                    } finally {
                      setDeleteProjectTarget(null);
                    }
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="form-submit-btn large-gradient-btn"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  onClick={() => setDeleteProjectTarget(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Project Details Modal Popup */}
        {isViewModalOpen && viewTargetProject && (
          <div className="signin-modal-overlay" onClick={() => setIsViewModalOpen(false)}>
            <div className="signin-modal-card modal-scrollable" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsViewModalOpen(false)} aria-label="Close modal">✕</button>
              <div className="modal-header">
                <span className="project-category-tag" style={{
                  background: 'rgba(0, 242, 254, 0.1)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>{viewTargetProject.category}</span>
                <h2 className="modal-title">{viewTargetProject.title}</h2>
                <p className="modal-subtitle">Submitted by {viewTargetProject.developer} on {viewTargetProject.dateTime}</p>
              </div>
              <div className="project-view-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
                {viewTargetProject.thumbnail && (
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <img
                      src={viewTargetProject.thumbnail}
                      alt="Project Thumbnail"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                )}
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Description</h4>
                  <p style={{ lineHeight: '1.6', fontSize: '14.5px' }}>{viewTargetProject.description}</p>
                </div>
                {viewTargetProject.demoLink && (
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Demo Link</h4>
                    <p style={{ fontSize: '14.5px' }}>
                      <a href={viewTargetProject.demoLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {viewTargetProject.demoLink}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </p>
                  </div>
                )}
                {viewTargetProject.tags && viewTargetProject.tags.length > 0 && (
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Technologies Used</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {viewTargetProject.tags.map(tag => (
                        <span key={tag} className="project-tag-item">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Contact Details</h4>
                  <p style={{ fontSize: '14px' }}>Email: <a href={`mailto:${viewTargetProject.email}`} style={{ color: 'var(--accent-cyan)' }}>{viewTargetProject.email}</a></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed bottom-right toast notification */}
        {showToast && (
          <div className={`toast-notification-fixed toast-${toastType}`}>
            <div className="toast-icon">
              {toastType === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {toastType === 'warning' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="toast-title">{toastTitle}</h4>
              <p className="toast-desc">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Background glowing elements */}
      <div className="glow-orb-1" />
      <div className="glow-orb-2" />
      <div className="glow-orb-3" />

      {/* Sticky Navbar */}
      <div className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''} container`}>
          {/* Logo & Brand Name */}
          <a href="#" className="nav-logo-link" onClick={handleLogoClick}>
            <div className="logo-img-wrapper">
              <img src={logoImg} alt="Sydions Logo" className="logo-img" />
            </div>
            <span className="logo-text">Sydions</span>
          </a>

          {/* Desktop Nav Links */}
          <ul className="nav-menu">
            {navItems.map((item) => (
              <li key={item} className="nav-item">
                <a
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`nav-link ${activeLink === item ? 'active' : ''}`}
                  onClick={(e) => handleNavLinkClick(e, item)}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop Sign In Button */}
          <div className="navbar-btn-container">
            <button className="nav-btn-signin" type="button" onClick={() => setIsSignInModalOpen(true)}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Sign In
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className={`mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      <div className={`mobile-menu-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item} className="nav-item">
              <a
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className={`nav-link ${activeLink === item ? 'active' : ''}`}
                onClick={(e) => handleNavLinkClick(e, item)}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="nav-btn-signin"
          type="button"
          onClick={() => {
            setMobileMenuOpen(false)
            setIsSignInModalOpen(true)
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Sign In
        </button>
      </div>

      {currentPage === 'home' ? (
        <>
          {/* Hero Section */}
          <header className="hero-wrapper" id="home">
            <div className="hero-content container">
              {/* Text/CTA Column */}
              <div className="hero-text-side">
                {/* Green accent hub badge */}
                <div className="hero-badge">
                  <span className="badge-dot" />
                  Developer Showcase v1.0
                </div>

                {/* Title */}
                <h1 className="hero-title">
                  <span className="gradient-text-cyan">Sydions Project</span>
                  <span className="gradient-text-cyan">Showcase</span>
                </h1>

                {/* Subtitle */}
                <p className="hero-subtitle">
                  Explore projects created by Sydions developers. From web applications to AI, cybersecurity, and innovative software solutions.
                </p>

                {/* CTA Button */}
                <button className="hero-cta-btn" type="button" onClick={() => navigateTo('projects')}>
                  Explore Projects
                  <svg
                    className="btn-arrow-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>

              {/* Visual/Portal Column */}
              <div className="hero-visual-side">
                <div className="portal-container">
                  {/* Spinning Ring Ornaments */}
                  <div className="portal-ring-outer" />
                  <div className="portal-ring-inner" />

                  {/* Central Floating Logo Box */}
                  <div className="portal-logo-box">
                    <img src={logoImg} alt="Sydions Logo" className="portal-logo" />
                  </div>

                  {/* Tech Orbit Tag: Web Apps */}
                  <div className="tech-tag tag-web">
                    <svg
                      className="tag-icon-cyan"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 2 7 12 12 22 7 12 2 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    Web Apps
                  </div>

                  {/* Tech Orbit Tag: AI */}
                  <div className="tech-tag tag-ai">
                    <svg
                      className="tag-icon-green"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M12 6v12" />
                      <path d="M8 10h8" />
                      <path d="M8 14h8" />
                    </svg>
                    AI & ML
                  </div>

                  {/* Tech Orbit Tag: Cybersecurity */}
                  <div className="tech-tag tag-sec">
                    <svg
                      className="tag-icon-blue"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Security
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* About Sydions Section */}
          <section className="about-wrapper container" id="about">
            <div className="about-grid">
              <div className="about-text-side">
                <div className="section-badge">About Sydions</div>
                <h2 className="section-title">A Student Innovation & Technology Community</h2>
                <p className="about-desc">
                  Sydions is a premier student developer ecosystem dedicated to fostering engineering excellence, research innovation, and collaborative software creation. We connect passionate designers, builders, and thinkers to tackle real-world challenges.
                </p>
                <p className="about-desc">
                  By hosting hackathons, workshops, and building state-of-the-art open-source software, we prepare the next generation of engineers to pioneer in fields like artificial intelligence, cybersecurity, cloud architecture, and the Internet of Things.
                </p>
                <div className="about-features">
                  <div className="about-feature-item">
                    <span className="feature-dot cyan" />
                    <span>Peer-to-peer engineering mentorship</span>
                  </div>
                  <div className="about-feature-item">
                    <span className="feature-dot green" />
                    <span>Hands-on industrial scale research</span>
                  </div>
                  <div className="about-feature-item">
                    <span className="feature-dot blue" />
                    <span>Active open-source contributions</span>
                  </div>
                </div>
              </div>
              <div className="about-visual-side">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number gradient-text-cyan">150+</div>
                    <div className="stat-label">Active Members</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number gradient-text-green">50+</div>
                    <div className="stat-label">Projects Deployed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number gradient-text-blue">15+</div>
                    <div className="stat-label">Hackathons Won</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number gradient-text-cyan">5K+</div>
                    <div className="stat-label">Commits Pushed</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Us Section */}
          <section className="contact-wrapper container" id="contact-us">
            <div className="section-header">
              <div className="section-badge">Contact Us</div>
              <h2 className="section-title">Get in Touch</h2>
              <p className="section-subtitle">
                Connect with our team to explore opportunities, get help, or start a new collaboration.
              </p>
            </div>
            <div className="contact-grid">
              {/* Left side: Contact information with 3 feature cards */}
              <div className="contact-info-side">
                <div className="contact-feature-card card-cyan">
                  <div className="feature-icon icon-cyan">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">Community</h4>
                    <p className="feature-desc">Connect with student builders, participate in forums, and collaborate on open projects.</p>
                  </div>
                </div>

                <div className="contact-feature-card card-green">
                  <div className="feature-icon icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">Support</h4>
                    <p className="feature-desc">Get assistance with deployment, tooling issues, and framework troubleshooting.</p>
                  </div>
                </div>

                <div className="contact-feature-card card-blue">
                  <div className="feature-icon icon-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                  </div>
                  <div className="feature-text">
                    <h4 className="feature-title">Collaboration</h4>
                    <p className="feature-desc">Partner with us for hackathons, guest lectures, and enterprise projects.</p>
                  </div>
                </div>
              </div>

              {/* Right side: Small modern contact card */}
              <div className="contact-card-side">
                <div className="contact-form-card">
                  <form onSubmit={handleFormSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="fullName" className="form-label">Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@example.com"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">Contact Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter contact number"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reason" className="form-label">Reason</label>
                      <input
                        type="text"
                        id="reason"
                        name="reason"
                        required
                        value={formData.reason}
                        onChange={handleInputChange}
                        placeholder="Enter reason for contacting"
                        className="form-input"
                      />
                    </div>
                    <button type="submit" className="form-submit-btn large-gradient-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Projects Page View */
        <section className="projects-wrapper container" id="projects-section">
          <div className="projects-page-header">
            <button onClick={() => navigateTo('home')} className="back-home-btn" type="button">
              <svg className="btn-back-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </button>
            <div className="section-badge">Featured Projects</div>
            <h2 className="section-title">Built by Sydions Developers</h2>
            <p className="section-subtitle">
              Discover our cutting-edge student innovations spanning cybersecurity, artificial intelligence, internet of things, and modern web application development.
            </p>
          </div>
          <div className="project-grid">
            {projectsData.filter(p => p.status === 'approved').map((project) => (
              <div
                key={project.id}
                className={`project-card card-${project.color}`}
                onClick={() => {
                  setVisitorViewTargetProject(project)
                  setIsVisitorViewModalOpen(true)
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-card-glow" />
                <div className="project-category-wrapper">
                  <span className="project-category-tag">{project.category}</span>
                  <div className="project-category-icon">
                    {project.category === "Cybersecurity" && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    )}
                    {project.category === "AI" && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 6v12" />
                        <path d="M8 10h8" />
                        <path d="M8 14h8" />
                      </svg>
                    )}
                    {project.category === "IoT" && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                        <circle cx="12" cy="20" r="1" />
                      </svg>
                    )}
                    {project.category === "Web Development" && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                        <line x1="14" y1="4" x2="10" y2="20" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="project-card-title">{project.title}</h3>
                <p className="project-card-desc">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="project-tag-item">{tag}</span>
                  ))}
                </div>
                <button className="project-explore-btn" type="button">
                  Explore Project
                  <svg className="btn-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer-wrapper">
        <div className="footer-content container">
          <div className="footer-brand-column">
            <a href="#home" className="footer-logo-link" onClick={handleLogoClick}>
              <div className="logo-img-wrapper">
                <img src={logoImg} alt="Sydions Logo" className="logo-img" />
              </div>
              <span className="logo-text">Sydions</span>
            </a>
            <p className="footer-desc">Building the future of software, security, intelligence, and connected systems.</p>
          </div>
          <div className="footer-links-column">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links-list">
              <li><a href="#home" onClick={(e) => handleNavLinkClick(e, 'Home')}>Home</a></li>
              <li><a href="#about" onClick={(e) => handleNavLinkClick(e, 'About')}>About</a></li>
              <li><a href="#contact-us" onClick={(e) => handleNavLinkClick(e, 'Contact Us')}>Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-social-column">
            <h4 className="footer-heading">Connect</h4>
            <div className="social-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom container">
          <p>© 2026 Sydions Showcase. All Rights Reserved.</p>
        </div>
      </footer>



      {/* Visitor Project Details Modal Popup */}
      {isVisitorViewModalOpen && visitorViewTargetProject && (
        <div className="signin-modal-overlay" onClick={() => setIsVisitorViewModalOpen(false)}>
          <div className="signin-modal-card modal-scrollable" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsVisitorViewModalOpen(false)} aria-label="Close modal">✕</button>
            <div className="modal-header">
              <span className="project-category-tag" style={{
                background: 'rgba(0, 242, 254, 0.1)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '10px'
              }}>{visitorViewTargetProject.category}</span>
              <h2 className="modal-title">{visitorViewTargetProject.title}</h2>
              <p className="modal-subtitle">Built by {visitorViewTargetProject.developer} on {visitorViewTargetProject.dateTime}</p>
            </div>
            <div className="project-view-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
              {visitorViewTargetProject.thumbnail && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={visitorViewTargetProject.thumbnail}
                    alt="Project Thumbnail"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Description</h4>
                <p style={{ lineHeight: '1.6', fontSize: '14.5px' }}>{visitorViewTargetProject.description}</p>
              </div>
              {visitorViewTargetProject.demoLink && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Demo Link</h4>
                  <p style={{ fontSize: '14.5px' }}>
                    <a href={sanitizeUrl(visitorViewTargetProject.demoLink)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {visitorViewTargetProject.demoLink}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </p>
                </div>
              )}
              {visitorViewTargetProject.tags && visitorViewTargetProject.tags.length > 0 && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Technologies Used</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {visitorViewTargetProject.tags.map(tag => (
                      <span key={tag} className="project-tag-item">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Contact Developer</h4>
                <p style={{ fontSize: '14px' }}>Email: <a href={`mailto:${visitorViewTargetProject.email}`} style={{ color: 'var(--accent-cyan)' }}>{visitorViewTargetProject.email}</a></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign In/Up Modal Dialog Overlay */}
      {isSignInModalOpen && (
        <div className="signin-modal-overlay" onClick={closeModal}>
          <div className="signin-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal} aria-label="Close modal">✕</button>
            <div className="modal-header">
              <h2 className="modal-title">Sign In</h2>
              <p className="modal-subtitle">Enter your credentials to access your dashboard.</p>
            </div>
            <form onSubmit={handleSignInSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="signin-usernameOrEmail" className="form-label">Username or Email</label>
                <input
                  type="text"
                  id="signin-usernameOrEmail"
                  name="usernameOrEmail"
                  required
                  value={signInData.usernameOrEmail}
                  onChange={handleSignInChange}
                  placeholder="Enter your username or email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signin-password" className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signin-password"
                    name="password"
                    required
                    value={signInData.password}
                    onChange={handleSignInChange}
                    placeholder="Enter your password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="form-submit-btn large-gradient-btn">
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fixed bottom-right toast notification */}
      {showToast && (
        <div className={`toast-notification-fixed toast-${toastType}`}>
          <div className="toast-icon">
            {toastType === 'success' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {toastType === 'error' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            {toastType === 'warning' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>
          <div>
            <h4 className="toast-title">{toastTitle}</h4>
            <p className="toast-desc">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
