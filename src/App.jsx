import { useState, useEffect } from 'react'
import logoImg from './assets/hero.jpeg'
import './App.css'
import { supabase } from './supabaseClient'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('Home')
  const [currentPage, setCurrentPage] = useState(
    window.location.pathname === '/projects' ? 'projects' : 'home'
  )
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastTitle, setToastTitle] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [signInData, setSignInData] = useState({ username: '', email: '', password: '' })
  const [selectedRole, setSelectedRole] = useState('Developer')
  const [isSignUp, setIsSignUp] = useState(false)
  const [signUpData, setSignUpData] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)
  const [adminsData, setAdminsData] = useState([
    { username: 'admin', email: 'admin@sydions.org', password: 'password123' }
  ])

  // Admin and Dashboard states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  })
  const [adminActiveTab, setAdminActiveTab] = useState('home')
  const [projectsSubTab, setProjectsSubTab] = useState('active')
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [rejectionTargetProjectId, setRejectionTargetProjectId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewTargetProject, setViewTargetProject] = useState(null)
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
  const [addDevData, setAddDevData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
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
          status: d.status === 'active' ? 'Active' : 'Disabled'
        })));
      }

      // Load notifications from localStorage
      const notifsRaw = localStorage.getItem('sydions_notifications');
      const loadedNotifications = notifsRaw ? JSON.parse(notifsRaw) : [];
      setNotifications(loadedNotifications);
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

  const triggerToast = (title, message) => {
    setToastTitle(title)
    setToastMessage(message)
    setShowToast(true)
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout)
    }
    window.toastTimeout = setTimeout(() => {
      setShowToast(false)
    }, 3500)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const contactsRaw = localStorage.getItem('sydions_contacts');
      const currentContacts = contactsRaw ? JSON.parse(contactsRaw) : [];
      currentContacts.unshift({
        id: Date.now(),
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateTime: new Date().toISOString()
      });
      localStorage.setItem('sydions_contacts', JSON.stringify(currentContacts));
      setFormData({ fullName: '', email: '', phone: '' });
      triggerToast("Request Submitted!", "Request submitted successfully. We'll contact you soon.");
    } catch (err) {
      triggerToast("Error", "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsSignInModalOpen(false)
    setIsSignUp(false)
    setSignInData({ username: '', email: '', password: '' })
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
      const { email, password } = signInData;
      if (!email.trim() || !password) {
        triggerToast("Error", "Please fill in all credentials.");
        setIsSubmitting(false);
        return;
      }

      if (selectedRole === 'Admin') {

        if (
          signInData.username === 'admin' &&
          email === 'admin@sydions.org' &&
          password === 'admin123'
        ) {

          localStorage.setItem('isAdminLoggedIn', 'true');
          setIsAdminLoggedIn(true);

          closeModal();

          triggerToast(
            'Success!',
            'Signed in as Admin.'
          );

          return;
        }

        triggerToast(
          'Authentication Error',
          'Invalid admin credentials.'
        );

        return;
      }

      if (selectedRole === 'Developer') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.trim())
          .eq('password', password)
          .eq('role', 'developer')
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          triggerToast("Authentication Error", error.message);
          setIsSubmitting(false);
          return;
        }

        if (!data) {
          triggerToast("Authentication Error", "Invalid email/password or account is inactive.");
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
        triggerToast("Success!", "Signed in successfully.");
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      triggerToast("Error", "An unexpected authentication error occurred.");
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

  // Close Sign In modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    if (isSignInModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSignInModalOpen])

  // Close action menu dropdown and project popover when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionMenuId(null)
      setActivePopoverProjectId(null)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  // Close project popover on scroll
  useEffect(() => {
    const handleScroll = () => {
      setActivePopoverProjectId(null)
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
              onClick={() => setAdminActiveTab('home')}
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
              onClick={() => setAdminActiveTab('projects')}
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
              onClick={() => setAdminActiveTab('developers')}
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
              className="sidebar-nav-item logout"
              onClick={() => {
                localStorage.removeItem('isAdminLoggedIn')
                setIsAdminLoggedIn(false)
                window.location.href = '/'
              }}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Dashboard Content Area */}
        <main className="admin-main">
          {/* Topbar */}
          <header className="admin-topbar">
            <h1 className="admin-page-title">
              {adminActiveTab === 'home' && "Dashboard Overview"}
              {adminActiveTab === 'projects' && "Project Management"}
              {adminActiveTab === 'developers' && "Developers Directory"}
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
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notifications-dropdown-list">
                      {notifications.length === 0 ? (
                        <p className="no-notifications">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                            <p className="notification-text">{n.text}</p>
                            <span className="notification-time">{n.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Home Tab */}
          {adminActiveTab === 'home' && (
            <div className="admin-tab-content fade-in">
              {/* Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card card-cyan">
                  <div className="stat-value">{projectsData.filter(p => p.status === 'approved').length}</div>
                  <div className="stat-label">Approved Projects</div>
                </div>
                <div className="admin-stat-card card-green">
                  <div className="stat-value">{projectsData.filter(p => p.status === 'pending').length}</div>
                  <div className="stat-label">Pending Projects</div>
                </div>
                <div className="admin-stat-card card-blue">
                  <div className="stat-value">{developersData.length}</div>
                  <div className="stat-label">Total Developers</div>
                </div>
                <div className="admin-stat-card card-red">
                  <div className="stat-value">{projectsData.filter(p => p.status === 'rejected').length}</div>
                  <div className="stat-label">Rejected Projects</div>
                </div>
              </div>

              {/* Quick overview or visual chart dummy */}
              <div className="dashboard-row">
                <div className="dashboard-panel glass-panel">
                  <h3>System Status</h3>
                  <div className="system-status-grid">
                    <div className="status-item">
                      <span className="status-indicator online"></span>
                      <span>Database Connection: Optimal</span>
                    </div>
                    <div className="status-item">
                      <span className="status-indicator online"></span>
                      <span>Vite Edge Cache: Active</span>
                    </div>
                    <div className="status-item">
                      <span className="status-indicator online"></span>
                      <span>AI Model Pipeline: Ready</span>
                    </div>
                  </div>
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
                  onClick={() => setProjectsSubTab('active')}
                >
                  Active Projects ({projectsData.filter(p => p.status === 'pending').length})
                </button>
                <button
                  className={`nested-tab-btn ${projectsSubTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setProjectsSubTab('approved')}
                >
                  Approved Projects ({projectsData.filter(p => p.status === 'approved').length})
                </button>
                <button
                  className={`nested-tab-btn ${projectsSubTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setProjectsSubTab('rejected')}
                >
                  Rejected Projects ({projectsData.filter(p => p.status === 'rejected').length})
                </button>
              </div>

              {/* Active Projects (Pending Approval) */}
              {projectsSubTab === 'active' && (
                <div className="table-responsive glass-panel">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Developer Name</th>
                        <th>Date/Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectsData.filter(p => p.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center no-data">No pending projects</td>
                        </tr>
                      ) : (
                        projectsData.filter(p => p.status === 'pending').map(p => (
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
                            <td>
                              <div className="action-buttons-cell">
                                <button
                                  className="action-btn approve-btn"
                                  onClick={() => {
                                    const projsRaw = localStorage.getItem('sydions_projects');
                                    const currentProjs = projsRaw ? JSON.parse(projsRaw) : [];
                                    const updatedProjs = currentProjs.map(proj => proj.id === p.id ? { ...proj, status: 'approved' } : proj);
                                    localStorage.setItem('sydions_projects', JSON.stringify(updatedProjs));
                                    triggerToast("Approved", `Approved project '${p.title}'.`);
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
              )}

              {/* Approved Projects */}
              {projectsSubTab === 'approved' && (
                <div className="table-responsive glass-panel">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Developer Name</th>
                        <th>Date/Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectsData.filter(p => p.status === 'approved').length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center no-data">No approved projects</td>
                        </tr>
                      ) : (
                        projectsData.filter(p => p.status === 'approved').map(p => (
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
                            <td>
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
                                    triggerToast("Removed", `Moved '${p.title}' back to Active Projects.`);
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
              )}

              {/* Rejected Projects */}
              {projectsSubTab === 'rejected' && (
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
                      {projectsData.filter(p => p.status === 'rejected').length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center no-data">No rejected projects</td>
                        </tr>
                      ) : (
                        projectsData.filter(p => p.status === 'rejected').map(p => (
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
              )}
            </div>
          )}

          {/* Developers Tab */}
          {adminActiveTab === 'developers' && (
            <div className="admin-tab-content fade-in">
              <div className="developers-tab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>Developers Directory</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="action-btn approve-btn" onClick={() => {
                    setAddDevData({ username: '', email: '', password: '', confirmPassword: '' })
                    setIsAddDevModalOpen(true)
                  }}>
                    + Add Developer
                  </button>
                  <button className="action-btn view-btn" onClick={() => setIsBulkImportModalOpen(true)}>
                    + Bulk Import
                  </button>
                </div>
              </div>

              <div className="table-responsive glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Projects Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {developersData.map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                        <td>{d.email}</td>
                        <td>{d.projectsCount}</td>
                        <td>
                          <span className={`status-badge ${d.status === 'Active' ? 'approved' : 'rejected'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              className={`three-dots-btn ${activeActionMenuId === d.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(activeActionMenuId === d.id ? null : d.id);
                              }}
                              title="Actions"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>

                            {activeActionMenuId === d.id && (
                              <div className="vertical-action-buttons" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => {
                                    setEditDevTarget(d)
                                    setEditDevData({ username: d.name, email: d.email })
                                    setIsEditDevModalOpen(true)
                                    setActiveActionMenuId(null)
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => {
                                    setResetPasswordTarget(d)
                                    setResetPasswordData({ password: '', confirmPassword: '' })
                                    setIsResetPasswordModalOpen(true)
                                    setActiveActionMenuId(null)
                                  }}
                                >
                                  Reset Password
                                </button>
                                <button
                                  className={`action-btn ${d.status === 'Active' ? 'remove-btn' : 'approve-btn'}`}
                                  onClick={async () => {
                                    const newStatus = d.status === 'Active' ? 'Disabled' : 'Active';
                                    const newDbStatus = newStatus === 'Active' ? 'active' : 'disabled';
                                    const { error } = await supabase
                                      .from('profiles')
                                      .update({ status: newDbStatus })
                                      .eq('id', d.id);
                                    if (error) {
                                      triggerToast("Error", error.message);
                                    } else {
                                      triggerToast(newStatus === 'Active' ? 'Enabled' : 'Disabled', `Developer '${d.name}' account is ${newStatus.toLowerCase()}.`);
                                      fetchAllData();
                                    }
                                    setActiveActionMenuId(null);
                                  }}
                                >
                                  {d.status === 'Active' ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  className="action-btn reject-btn"
                                  onClick={() => {
                                    setDeleteConfirmTarget(d)
                                    setActiveActionMenuId(null)
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

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
                    triggerToast("Error", "Passwords do not match.");
                    return;
                  }
                  if (addDevData.password.length < 8) {
                    triggerToast("Error", "Password must be at least 8 characters long.");
                    return;
                  }

                  try {
                    const { data: existingDevs, error: checkError } = await supabase
                      .from('profiles')
                      .select('id')
                      .or(`username.ilike.${addDevData.username.trim()},email.ilike.${addDevData.email.trim()}`);

                    if (existingDevs && existingDevs.length > 0) {
                      triggerToast("Error", "Username or Email already registered.");
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
                          status: 'active'
                        }
                      ]);
                    if (insertError) {
                      triggerToast("Error", insertError.message);
                      return;
                    }

                    setIsAddDevModalOpen(false);
                    setAddDevData({ username: '', email: '', password: '', confirmPassword: '' });
                    triggerToast("Success!", `Developer '${addDevData.username.trim()}' created successfully.`);
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
                  <input
                    type="password"
                    required
                    value={addDevData.password}
                    onChange={(e) => setAddDevData({ ...addDevData, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={addDevData.confirmPassword}
                    onChange={(e) => setAddDevData({ ...addDevData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="form-input"
                  />
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

        {/* Fixed bottom-right toast notification */}
        {showToast && (
          <div className="toast-notification-fixed">
            <div className="toast-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
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

      // Notification
      const notifsRaw = localStorage.getItem('sydions_notifications');
      const currentNotifs = notifsRaw ? JSON.parse(notifsRaw) : [];
      const newNotif = {
        id: Date.now(),
        text: `New project '${submitForm.title}' submitted by ${submitForm.builtBy || loggedInDeveloper.name}`,
        time: "Just now",
        read: false
      };
      currentNotifs.unshift(newNotif);
      localStorage.setItem('sydions_notifications', JSON.stringify(currentNotifs));

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
            <div className="stat-value gradient-text-blue">{submittedCount}</div>
            <div className="stat-label">Projects Submitted</div>
            <p className="card-description">Total number of projects submitted to the Sydions Showcase registry.</p>
          </div>
          <div className="admin-stat-card card-cyan dev-home-card">
            <div className="stat-value gradient-text-cyan">{publishedCount}</div>
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
            onClick={() => setDevProjectsSubTab('pending')}
          >
            Pending ({pendingProjects.length})
          </button>
          <button
            className={`nested-tab-btn ${devProjectsSubTab === 'approved' ? 'active' : ''}`}
            onClick={() => setDevProjectsSubTab('approved')}
          >
            Approved ({approvedProjects.length})
          </button>
          <button
            className={`nested-tab-btn ${devProjectsSubTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setDevProjectsSubTab('rejected')}
          >
            Rejected ({rejectedProjects.length})
          </button>
        </div>

        {devProjectsSubTab === 'pending' && (
          <div className="table-responsive glass-panel">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingProjects.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center no-data">No pending projects.</td>
                  </tr>
                ) : (
                  pendingProjects.map(p => (
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {devProjectsSubTab === 'approved' && (
          <div className="table-responsive glass-panel">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Published Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedProjects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center no-data">No approved projects.</td>
                  </tr>
                ) : (
                  approvedProjects.map(p => (
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
                      <td>
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
        )}

        {devProjectsSubTab === 'rejected' && (
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
                {rejectedProjects.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center no-data">No rejected projects.</td>
                  </tr>
                ) : (
                  rejectedProjects.map(p => (
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
              onClick={() => setDevActiveTab('home')}
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
              onClick={() => setDevActiveTab('projects')}
            >
              <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Projects
            </button>
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
          </nav>
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
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
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
          <div className="toast-notification-fixed">
            <div className="toast-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
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
              <div key={project.id} className={`project-card card-${project.color}`}>
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
              <div className="role-selector-container">
                <button
                  type="button"
                  className={`role-select-btn role-admin ${selectedRole === 'Admin' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('Admin')}
                >
                  <svg className="role-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Admin
                </button>
                <button
                  type="button"
                  className={`role-select-btn role-developer ${selectedRole === 'Developer' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('Developer')}
                >
                  <svg className="role-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Developer
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="signin-username" className="form-label">Username</label>
                <input
                  type="text"
                  id="signin-username"
                  name="username"
                  required={selectedRole === 'Admin'}
                  value={signInData.username}
                  onChange={handleSignInChange}
                  placeholder="Enter your username"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signin-email" className="form-label">Email ID</label>
                <input
                  type="email"
                  id="signin-email"
                  name="email"
                  required
                  value={signInData.email}
                  onChange={handleSignInChange}
                  placeholder="name@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="signin-password" className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signin-password"
                    name="password"
                    required
                    value={signInData.password}
                    onChange={handleSignInChange}
                    placeholder="Enter your password"
                    className="form-input"
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'color var(--transition-fast)'
                    }}
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
        <div className="toast-notification-fixed">
          <div className="toast-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
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
