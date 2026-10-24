/**
 * ResolveDesk - Customer Feedback & Complaint Management System
 * Core Application Logic (Vanilla JavaScript + LocalStorage)
 * Modern Banking CRM Architecture with Admin Authentication & Session Management
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEY = 'resolveDesk_complaints_v1';
  const ADMIN_SESSION_KEY = 'resolveDesk_admin_session_v1';
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  // Initial realistic sample data
  const SAMPLE_COMPLAINTS = [
    {
      id: 'CMP-10492',
      fullName: 'Jonathan Hayes',
      email: 'j.hayes@example.com',
      category: 'Billing',
      subject: 'Double charge on debit card transaction at grocery store',
      details: 'On October 22nd, I attempted to purchase groceries totaling $84.20. The POS terminal initially gave a communication timeout, and upon trying again, my checking account was debited twice ($84.20 x 2). Merchant statement shows one reversal pending, but no refund has posted.',
      rating: 2,
      status: 'In Progress',
      adminNote: 'Merchant processing dispute initiated under reference #DISP-8921. Contacted acquirer network to expedite automated clearing. Credit adjustment expected within 24 hours.',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
    },
    {
      id: 'CMP-10493',
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@businesscorp.org',
      category: 'Service',
      subject: 'Delayed international wire transfer clearance to supplier',
      details: 'Initiated an urgent commercial wire transfer to our supplier in Frankfurt on Monday. The funds were deducted immediately, but our supplier has not received the SWIFT confirmation code after 4 business days.',
      rating: 4,
      status: 'Resolved',
      adminNote: 'International treasury desk identified intermediary bank compliance verification hold. SWIFT MT103 confirmation copy transmitted to customer. Funds credited successfully on Oct 23rd.',
      createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    },
    {
      id: 'CMP-10494',
      fullName: 'Michael Chen',
      email: 'mchen.tech@gmail.com',
      category: 'Technical Issue',
      subject: 'Biometric FaceID authentication failing repeatedly on mobile app v4.2',
      details: 'After updating the iOS banking mobile app to version 4.2.0 yesterday, FaceID prompt crashes immediately upon launch on iPhone 15 Pro. Forced to re-enter Master Password every single session.',
      rating: 1,
      status: 'Pending',
      adminNote: '',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
    },
    {
      id: 'CMP-10495',
      fullName: 'Emily Rodriguez',
      email: 'emily.rodriguez@outlook.com',
      category: 'Product',
      subject: 'Commendation and feedback for new automated recurring savings vault',
      details: 'I love the new recurring spare-change round-up feature! It has helped me save effortlessly. My only suggestion is allowing custom sub-vault goals for travel and emergency funds.',
      rating: 5,
      status: 'Resolved',
      adminNote: 'Thanked customer for stellar feedback. Feature suggestion for multi-vault goal naming has been forwarded to the Mobile Product Roadmap queue (Feature Ref: PRD-304).',
      createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
    }
  ];

  // Rating descriptor mapping
  const RATING_DESCRIPTIONS = {
    1: '1 - Very Poor',
    2: '2 - Poor',
    3: '3 - Average',
    4: '4 - Good',
    5: '5 - Excellent'
  };

  // State object
  const state = {
    currentRole: 'customer', // 'customer' | 'admin'
    currentCustomerTab: 'submit', // 'submit' | 'track'
    selectedRating: 0,
    complaints: [],
    lastSubmittedId: null,
    pendingDeleteId: null
  };

  /**
   * Application Controller & Public Interface
   */
  window.app = {
    // -----------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------
    init() {
      this.loadStorage();
      this.setupEventListeners();
      this.updateAdminAuthUI();
      this.renderQuickSampleTags();
      this.updateAdminKPIs();
      this.filterComplaints();
    },

    // -----------------------------------------------------------------
    // Admin Authentication & Session Management
    // -----------------------------------------------------------------
    isAdminAuthenticated() {
      return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    },

    updateAdminAuthUI() {
      const isAuth = this.isAdminAuthenticated();
      const indicator = document.getElementById('admin-session-indicator');
      const adminRoleBtn = document.getElementById('role-admin-btn');

      if (indicator) {
        indicator.style.display = isAuth ? 'inline-flex' : 'none';
      }

      if (adminRoleBtn) {
        if (isAuth) {
          adminRoleBtn.setAttribute('title', 'Admin Dashboard (Active Session)');
        } else {
          adminRoleBtn.setAttribute('title', 'Admin Dashboard (Authentication Required)');
        }
      }
    },

    openAdminLoginModal() {
      const errorAlert = document.getElementById('login-error-alert');
      if (errorAlert) errorAlert.classList.add('hidden');

      const usernameInput = document.getElementById('admin-username');
      const passwordInput = document.getElementById('admin-password');

      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';

      this.openModal('admin-login-modal');

      setTimeout(() => {
        if (usernameInput) usernameInput.focus();
      }, 150);
    },

    quickFillCredentials() {
      const usernameInput = document.getElementById('admin-username');
      const passwordInput = document.getElementById('admin-password');
      const errorAlert = document.getElementById('login-error-alert');

      if (usernameInput) usernameInput.value = ADMIN_CREDENTIALS.username;
      if (passwordInput) passwordInput.value = ADMIN_CREDENTIALS.password;
      if (errorAlert) errorAlert.classList.add('hidden');

      this.showToast('Demo credentials auto-filled (admin / admin123)', 'info');
    },

    togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
      }
    },

    handleAdminLogin(e) {
      e.preventDefault();

      const usernameInput = document.getElementById('admin-username');
      const passwordInput = document.getElementById('admin-password');
      const errorAlert = document.getElementById('login-error-alert');
      const modalDialog = document.querySelector('#admin-login-modal .modal-dialog');

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Successful authentication
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
        this.updateAdminAuthUI();
        this.closeModal('admin-login-modal');
        this.showToast('Welcome back, Administrator! Access granted.', 'success');

        // Switch to admin view directly
        this.proceedToAdminRole();
      } else {
        // Failed login
        if (errorAlert) errorAlert.classList.remove('hidden');
        if (modalDialog) {
          modalDialog.classList.remove('shake');
          void modalDialog.offsetWidth; // trigger reflow
          modalDialog.classList.add('shake');
        }
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    },

    adminLogout() {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      this.updateAdminAuthUI();
      this.switchRole('customer');
      this.showToast('Administrator session ended successfully.', 'info');
    },

    // -----------------------------------------------------------------
    // Storage Management
    // -----------------------------------------------------------------
    loadStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          state.complaints = JSON.parse(stored);
        } else {
          // Initialize with sample banking complaints
          state.complaints = JSON.parse(JSON.stringify(SAMPLE_COMPLAINTS));
          this.saveStorage();
        }
      } catch (err) {
        console.error('Failed to parse localStorage data:', err);
        state.complaints = JSON.parse(JSON.stringify(SAMPLE_COMPLAINTS));
      }
      this.updateBadgeCount();
    },

    saveStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.complaints));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
        this.showToast('Failed to save data. LocalStorage quota exceeded or disabled.', 'danger');
      }
      this.updateBadgeCount();
    },

    resetSampleDataPrompt() {
      if (confirm('Are you sure you want to restore the default sample complaints? This will reset all tickets to the initial demo state.')) {
        state.complaints = JSON.parse(JSON.stringify(SAMPLE_COMPLAINTS));
        this.saveStorage();
        this.updateAdminKPIs();
        this.filterComplaints();
        this.renderQuickSampleTags();
        this.showToast('Sample banking complaints restored successfully!', 'success');
      }
    },

    quickSeedNotification() {
      const count = state.complaints.length;
      alert(`LocalStorage Status: Active\nStorage Key: "${STORAGE_KEY}"\nStored Complaints: ${count} records\nData persists across page refreshes and browser tabs.`);
    },

    updateBadgeCount() {
      const badge = document.getElementById('admin-badge-count');
      if (badge) {
        const pendingCount = state.complaints.filter(c => c.status === 'Pending').length;
        badge.textContent = pendingCount;
        badge.title = `${pendingCount} pending complaint(s)`;
      }
    },

    // -----------------------------------------------------------------
    // Role & Tab Switching
    // -----------------------------------------------------------------
    switchRole(role) {
      if (role === 'admin') {
        if (!this.isAdminAuthenticated()) {
          this.openAdminLoginModal();
          return;
        }
        this.proceedToAdminRole();
      } else {
        this.proceedToCustomerRole();
      }
    },

    proceedToAdminRole() {
      state.currentRole = 'admin';

      const custView = document.getElementById('customer-view');
      const adminView = document.getElementById('admin-view');
      const custBtn = document.getElementById('role-customer-btn');
      const adminBtn = document.getElementById('role-admin-btn');

      if (custView) custView.classList.remove('active');
      if (adminView) adminView.classList.add('active');
      if (custBtn) {
        custBtn.classList.remove('active');
        custBtn.setAttribute('aria-selected', 'false');
      }
      if (adminBtn) {
        adminBtn.classList.add('active');
        adminBtn.setAttribute('aria-selected', 'true');
      }

      // Refresh admin dashboard stats and table
      this.updateAdminKPIs();
      this.filterComplaints();
    },

    proceedToCustomerRole() {
      state.currentRole = 'customer';

      const custView = document.getElementById('customer-view');
      const adminView = document.getElementById('admin-view');
      const custBtn = document.getElementById('role-customer-btn');
      const adminBtn = document.getElementById('role-admin-btn');

      if (adminView) adminView.classList.remove('active');
      if (custView) custView.classList.add('active');
      if (adminBtn) {
        adminBtn.classList.remove('active');
        adminBtn.setAttribute('aria-selected', 'false');
      }
      if (custBtn) {
        custBtn.classList.add('active');
        custBtn.setAttribute('aria-selected', 'true');
      }

      this.renderQuickSampleTags();
    },

    switchCustomerTab(tabName) {
      state.currentCustomerTab = tabName;

      const submitPane = document.getElementById('customer-submit-pane');
      const trackPane = document.getElementById('customer-track-pane');
      const submitBtn = document.getElementById('tab-submit-btn');
      const trackBtn = document.getElementById('tab-track-btn');

      if (tabName === 'track') {
        if (submitPane) submitPane.classList.remove('active');
        if (trackPane) trackPane.classList.add('active');
        if (submitBtn) submitBtn.classList.remove('active');
        if (trackBtn) trackBtn.classList.add('active');

        // Focus search input
        setTimeout(() => {
          const inp = document.getElementById('track-search-input');
          if (inp) inp.focus();
        }, 100);
      } else {
        if (trackPane) trackPane.classList.remove('active');
        if (submitPane) submitPane.classList.add('active');
        if (trackBtn) trackBtn.classList.remove('active');
        if (submitBtn) submitBtn.classList.add('active');
      }
    },

    // -----------------------------------------------------------------
    // Star Rating Component
    // -----------------------------------------------------------------
    setRating(val) {
      state.selectedRating = val;
      const ratingInput = document.getElementById('cust-rating');
      if (ratingInput) ratingInput.value = val;

      const ratingLabel = document.getElementById('rating-label');
      if (ratingLabel) {
        ratingLabel.textContent = RATING_DESCRIPTIONS[val] || '';
        ratingLabel.style.color = '#f59e0b';
      }

      const buttons = document.querySelectorAll('#star-rating-container .star-btn');
      buttons.forEach((btn, index) => {
        if (index < val) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Clear rating error if shown
      this.clearFieldError('err-rating');
    },

    updateCharCount(textarea) {
      const counter = document.getElementById('char-counter');
      if (counter) {
        counter.textContent = `${textarea.value.length} / 1000 characters`;
      }
    },

    // -----------------------------------------------------------------
    // Form Validation & Submission
    // -----------------------------------------------------------------
    generateComplaintId() {
      const existing = new Set(state.complaints.map(c => c.id));
      let newId = '';
      let attempts = 0;

      while (attempts < 200) {
        const rand = Math.floor(10000 + Math.random() * 90000);
        newId = `CMP-${rand}`;
        if (!existing.has(newId)) break;
        attempts++;
      }
      return newId;
    },

    validateForm() {
      let isValid = true;

      // Full Name
      const name = document.getElementById('cust-fullname');
      if (!name || !name.value.trim()) {
        this.showFieldError('err-fullname', name, 'Please enter your full name.');
        isValid = false;
      } else {
        this.clearFieldError('err-fullname', name);
      }

      // Email
      const email = document.getElementById('cust-email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !email.value.trim()) {
        this.showFieldError('err-email', email, 'Please enter your email address.');
        isValid = false;
      } else if (!emailRegex.test(email.value.trim())) {
        this.showFieldError('err-email', email, 'Please enter a valid email format.');
        isValid = false;
      } else {
        this.clearFieldError('err-email', email);
      }

      // Category
      const cat = document.getElementById('cust-category');
      if (!cat || !cat.value) {
        this.showFieldError('err-category', cat, 'Please select a complaint category.');
        isValid = false;
      } else {
        this.clearFieldError('err-category', cat);
      }

      // Rating
      if (!state.selectedRating || state.selectedRating < 1) {
        this.showFieldError('err-rating', null, 'Please select a star rating (1 to 5).');
        isValid = false;
      } else {
        this.clearFieldError('err-rating');
      }

      // Subject
      const subject = document.getElementById('cust-subject');
      if (!subject || !subject.value.trim()) {
        this.showFieldError('err-subject', subject, 'Please enter a subject summary.');
        isValid = false;
      } else {
        this.clearFieldError('err-subject', subject);
      }

      // Details
      const details = document.getElementById('cust-details');
      if (!details || !details.value.trim()) {
        this.showFieldError('err-details', details, 'Please describe your complaint or feedback details.');
        isValid = false;
      } else if (details.value.trim().length < 10) {
        this.showFieldError('err-details', details, 'Please provide more details (minimum 10 characters).');
        isValid = false;
      } else {
        this.clearFieldError('err-details', details);
      }

      return isValid;
    },

    showFieldError(elementId, inputElem, message) {
      const err = document.getElementById(elementId);
      if (err) {
        err.textContent = message;
        err.style.display = 'block';
      }
      if (inputElem) {
        inputElem.closest('.form-group')?.classList.add('has-error');
      }
    },

    clearFieldError(elementId, inputElem) {
      const err = document.getElementById(elementId);
      if (err) {
        err.textContent = '';
        err.style.display = 'none';
      }
      if (inputElem) {
        inputElem.closest('.form-group')?.classList.remove('has-error');
      }
    },

    handleComplaintSubmit(e) {
      e.preventDefault();

      if (!this.validateForm()) {
        this.showToast('Please correct the highlighted fields before submitting.', 'warning');
        return;
      }

      const form = document.getElementById('complaint-form');
      const formData = new FormData(form);

      const newId = this.generateComplaintId();
      const newComplaint = {
        id: newId,
        fullName: formData.get('fullname').trim(),
        email: formData.get('email').trim(),
        category: formData.get('category'),
        subject: formData.get('subject').trim(),
        details: formData.get('details').trim(),
        rating: parseInt(state.selectedRating, 10),
        status: 'Pending',
        adminNote: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Prepend to complaints list
      state.complaints.unshift(newComplaint);
      this.saveStorage();
      state.lastSubmittedId = newId;

      // Show Confirmation Modal
      const modalIdElem = document.getElementById('modal-ticket-id');
      if (modalIdElem) modalIdElem.textContent = newId;
      this.openModal('success-modal');

      // Reset form
      this.resetForm();
      this.renderQuickSampleTags();
      this.updateAdminKPIs();
      this.showToast(`Complaint ${newId} submitted successfully!`, 'success');
    },

    resetForm() {
      const form = document.getElementById('complaint-form');
      if (form) form.reset();
      this.setRating(0);
      const ratingLabel = document.getElementById('rating-label');
      if (ratingLabel) {
        ratingLabel.textContent = 'Select a rating';
        ratingLabel.style.color = '';
      }
      const counter = document.getElementById('char-counter');
      if (counter) counter.textContent = '0 / 1000 characters';

      // Clear any errors
      document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('has-error'));
      document.querySelectorAll('.field-error').forEach(fe => {
        fe.textContent = '';
        fe.style.display = 'none';
      });
    },

    directToTrackModal() {
      this.closeModal('success-modal');
      this.switchCustomerTab('track');
      if (state.lastSubmittedId) {
        const inp = document.getElementById('track-search-input');
        if (inp) {
          inp.value = state.lastSubmittedId;
          this.trackComplaint();
        }
      }
    },

    // -----------------------------------------------------------------
    // Customer Status Tracking
    // -----------------------------------------------------------------
    trackComplaint(idToSearch) {
      const input = document.getElementById('track-search-input');
      const query = (idToSearch || (input ? input.value : '')).trim().toUpperCase();
      const resultArea = document.getElementById('tracking-result-area');

      if (!query) {
        this.showToast('Please enter a valid Complaint ID.', 'warning');
        return;
      }

      if (input) input.value = query;

      const found = state.complaints.find(c => c.id.toUpperCase() === query);

      resultArea.classList.remove('hidden');

      if (!found) {
        resultArea.innerHTML = `
          <div class="not-found-card">
            <i class="fa-solid fa-magnifying-glass-chart not-found-icon"></i>
            <h4>No Record Found for "${this.escapeHtml(query)}"</h4>
            <p>Please double-check your Complaint Tracking ID. IDs are formatted like <code>CMP-10492</code>.</p>
          </div>
        `;
        return;
      }

      // Compute Timeline states
      let step1Class = 'completed';
      let step2Class = '';
      let step3Class = '';
      let progressWidth = '0%';

      if (found.status === 'Pending') {
        step1Class = 'active';
        progressWidth = '15%';
      } else if (found.status === 'In Progress') {
        step1Class = 'completed';
        step2Class = 'active';
        progressWidth = '50%';
      } else if (found.status === 'Resolved') {
        step1Class = 'completed';
        step2Class = 'completed';
        step3Class = 'completed active';
        progressWidth = '100%';
      }

      const createdFormatted = this.formatDate(found.createdAt);
      const updatedFormatted = this.formatDate(found.updatedAt);
      const statusBadge = this.generateStatusBadgeHtml(found.status);
      const starsHtml = this.generateStarsHtml(found.rating);

      let adminNoteHtml = '';
      if (found.adminNote && found.adminNote.trim()) {
        adminNoteHtml = `
          <div class="admin-notes-callout resolved-note">
            <div class="admin-notes-header">
              <span class="admin-notes-title">
                <i class="fa-solid fa-user-shield"></i> Official Admin Resolution Note
              </span>
              <span class="admin-notes-date">Updated: ${updatedFormatted}</span>
            </div>
            <div class="admin-notes-body">
              ${this.escapeHtml(found.adminNote)}
            </div>
          </div>
        `;
      } else if (found.status === 'In Progress') {
        adminNoteHtml = `
          <div class="admin-notes-callout progress-note">
            <div class="admin-notes-header">
              <span class="admin-notes-title">
                <i class="fa-solid fa-screwdriver-wrench"></i> Active Investigation in Progress
              </span>
            </div>
            <div class="admin-notes-body">
              Our specialized support and operations team is currently handling your case. Specific resolution notes will be posted as soon as the review concludes.
            </div>
          </div>
        `;
      } else {
        adminNoteHtml = `
          <div class="admin-notes-callout pending-note">
            <div class="admin-notes-header">
              <span class="admin-notes-title">
                <i class="fa-solid fa-hourglass-half"></i> Case Queued for Review
              </span>
            </div>
            <div class="admin-notes-body">
              An administrative case officer has been notified. Official notes and action updates will appear here once investigation begins.
            </div>
          </div>
        `;
      }

      resultArea.innerHTML = `
        <div class="track-card-header">
          <div class="track-ticket-header">
            <h4>${found.id}</h4>
            <div class="track-meta">
              <span>Submitted on ${createdFormatted}</span>
              <span> • </span>
              <span>Category: <strong>${this.escapeHtml(found.category)}</strong></span>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>

        <!-- Progress Timeline -->
        <div class="resolution-timeline">
          <div class="timeline-progress-bar" style="width: ${progressWidth};"></div>
          
          <div class="timeline-step ${step1Class}">
            <div class="timeline-dot"><i class="fa-solid fa-file-check"></i></div>
            <span class="timeline-label">Submitted</span>
            <span class="timeline-date">${createdFormatted}</span>
          </div>

          <div class="timeline-step ${step2Class}">
            <div class="timeline-dot"><i class="fa-solid fa-magnifying-glass-arrow-right"></i></div>
            <span class="timeline-label">In Review</span>
            <span class="timeline-date">${found.status !== 'Pending' ? updatedFormatted : 'Pending'}</span>
          </div>

          <div class="timeline-step ${step3Class}">
            <div class="timeline-dot"><i class="fa-solid fa-circle-check"></i></div>
            <span class="timeline-label">Resolved</span>
            <span class="timeline-date">${found.status === 'Resolved' ? updatedFormatted : 'Pending'}</span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="track-detail-grid">
          <div>
            <div class="track-field-label">Customer Name</div>
            <div class="track-field-val">${this.escapeHtml(found.fullName)}</div>
          </div>
          <div>
            <div class="track-field-label">Contact Email</div>
            <div class="track-field-val">${this.escapeHtml(found.email)}</div>
          </div>
          <div>
            <div class="track-field-label">Experience Rating</div>
            <div class="track-field-val">${starsHtml} (${found.rating}/5)</div>
          </div>
          <div>
            <div class="track-field-label">Current Status</div>
            <div class="track-field-val">${this.escapeHtml(found.status)}</div>
          </div>
        </div>

        <!-- Narrative Box -->
        <div class="track-narrative">
          <h5><i class="fa-solid fa-quote-left" style="color: #94a3b8; margin-right: 6px;"></i> ${this.escapeHtml(found.subject)}</h5>
          <p>${this.escapeHtml(found.details)}</p>
        </div>

        <!-- Admin Resolution Callout -->
        ${adminNoteHtml}
      `;
    },

    renderQuickSampleTags() {
      const container = document.getElementById('quick-sample-tags');
      if (!container) return;

      const samples = state.complaints.slice(0, 4);
      if (samples.length === 0) {
        container.innerHTML = '<span style="color:#94a3b8; font-size:0.8rem;">No active tickets</span>';
        return;
      }

      container.innerHTML = samples.map(c => `
        <button type="button" class="sample-pill" onclick="app.quickTrack('${c.id}')">
          ${c.id} (${c.status})
        </button>
      `).join('');
    },

    quickTrack(id) {
      const input = document.getElementById('track-search-input');
      if (input) input.value = id;
      this.trackComplaint(id);
    },

    // -----------------------------------------------------------------
    // Admin Dashboard: Analytics & Filtering
    // -----------------------------------------------------------------
    updateAdminKPIs() {
      const total = state.complaints.length;
      const pending = state.complaints.filter(c => c.status === 'Pending').length;
      const progress = state.complaints.filter(c => c.status === 'In Progress').length;
      const resolved = state.complaints.filter(c => c.status === 'Resolved').length;

      let avgRating = 0;
      if (total > 0) {
        const sum = state.complaints.reduce((acc, c) => acc + (c.rating || 0), 0);
        avgRating = (sum / total).toFixed(1);
      }

      // Update DOM
      const kpiTotal = document.getElementById('kpi-total');
      const kpiPending = document.getElementById('kpi-pending');
      const kpiProgress = document.getElementById('kpi-progress');
      const kpiResolved = document.getElementById('kpi-resolved');
      const kpiRating = document.getElementById('kpi-rating');
      const kpiStars = document.getElementById('kpi-stars');

      if (kpiTotal) kpiTotal.textContent = total;
      if (kpiPending) kpiPending.textContent = pending;
      if (kpiProgress) kpiProgress.textContent = progress;
      if (kpiResolved) kpiResolved.textContent = resolved;
      if (kpiRating) kpiRating.innerHTML = `${avgRating} <small>/ 5</small>`;
      if (kpiStars) kpiStars.innerHTML = this.generateStarsHtml(Math.round(avgRating));

      this.updateBadgeCount();
    },

    filterComplaints() {
      const searchInput = document.getElementById('admin-search-input');
      const statusSelect = document.getElementById('admin-filter-status');
      const categorySelect = document.getElementById('admin-filter-category');
      const sortSelect = document.getElementById('admin-sort-by');

      const searchQuery = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const statusFilter = statusSelect ? statusSelect.value : 'All';
      const categoryFilter = categorySelect ? categorySelect.value : 'All';
      const sortBy = sortSelect ? sortSelect.value : 'newest';

      let results = state.complaints.filter(item => {
        // Status filter
        if (statusFilter !== 'All' && item.status !== statusFilter) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'All' && item.category !== categoryFilter) {
          return false;
        }
        // Search filter (ID, Customer Name, Email, Subject)
        if (searchQuery) {
          const matchId = item.id.toLowerCase().includes(searchQuery);
          const matchName = item.fullName.toLowerCase().includes(searchQuery);
          const matchEmail = item.email.toLowerCase().includes(searchQuery);
          const matchSubject = item.subject.toLowerCase().includes(searchQuery);
          if (!matchId && !matchName && !matchEmail && !matchSubject) {
            return false;
          }
        }
        return true;
      });

      // Sorting
      results.sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortBy === 'rating-high') {
          return b.rating - a.rating;
        } else if (sortBy === 'rating-low') {
          return a.rating - b.rating;
        }
        return 0;
      });

      this.renderAdminTable(results);
    },

    renderAdminTable(items) {
      const tbody = document.getElementById('admin-table-body');
      const countLabel = document.getElementById('table-results-count');

      if (countLabel) {
        countLabel.textContent = `Showing ${items.length} of ${state.complaints.length} complaint${state.complaints.length === 1 ? '' : 's'}`;
      }

      if (!tbody) return;

      if (items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-table-state">
                <i class="fa-solid fa-folder-open"></i>
                <h4>No Matching Complaints</h4>
                <p>Try modifying your search criteria or resetting filters.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = items.map(c => `
        <tr>
          <td><span class="id-badge">${c.id}</span></td>
          <td class="customer-cell">
            <strong>${this.escapeHtml(c.fullName)}</strong>
            <small>${this.escapeHtml(c.email)}</small>
          </td>
          <td><span class="category-tag">${this.escapeHtml(c.category)}</span></td>
          <td class="table-subject-cell" title="${this.escapeHtml(c.subject)}">
            ${this.escapeHtml(c.subject)}
          </td>
          <td style="white-space: nowrap; font-size: 0.82rem; color: #64748b;">
            ${this.formatShortDate(c.createdAt)}
          </td>
          <td>
            <span class="table-rating-stars">${this.generateStarsHtml(c.rating)}</span>
          </td>
          <td>
            ${this.generateStatusBadgeHtml(c.status)}
          </td>
          <td class="text-right">
            <div class="table-actions">
              <button class="btn btn-outline btn-sm" onclick="app.openAdminDetailModal('${c.id}')" title="Inspect & Update Status">
                <i class="fa-solid fa-pen-to-square"></i> Manage
              </button>
              <button class="btn btn-danger-outline btn-sm" onclick="app.openDeleteConfirmModal('${c.id}')" title="Delete Complaint">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    },

    // -----------------------------------------------------------------
    // Admin Detail & Status Update Modal
    // -----------------------------------------------------------------
    openAdminDetailModal(complaintId) {
      const complaint = state.complaints.find(c => c.id === complaintId);
      if (!complaint) {
        this.showToast(`Complaint ${complaintId} not found.`, 'danger');
        return;
      }

      // Populate Modal Fields
      document.getElementById('admin-edit-id').value = complaint.id;
      document.getElementById('admin-modal-id').textContent = complaint.id;
      document.getElementById('admin-modal-name').textContent = complaint.fullName;
      document.getElementById('admin-modal-email').textContent = complaint.email;
      document.getElementById('admin-modal-category').textContent = complaint.category;
      document.getElementById('admin-modal-date').textContent = this.formatDate(complaint.createdAt);
      document.getElementById('admin-modal-rating').innerHTML = `${this.generateStarsHtml(complaint.rating)} (${complaint.rating}/5)`;
      document.getElementById('admin-modal-current-badge').innerHTML = this.generateStatusBadgeHtml(complaint.status);
      document.getElementById('admin-modal-subject').textContent = complaint.subject;
      document.getElementById('admin-modal-details').textContent = complaint.details;

      // Status Radio
      const radPending = document.getElementById('status-rad-pending');
      const radProgress = document.getElementById('status-rad-progress');
      const radResolved = document.getElementById('status-rad-resolved');

      if (complaint.status === 'Pending') radPending.checked = true;
      else if (complaint.status === 'In Progress') radProgress.checked = true;
      else if (complaint.status === 'Resolved') radResolved.checked = true;

      // Note
      const noteInput = document.getElementById('admin-resolution-note');
      if (noteInput) noteInput.value = complaint.adminNote || '';

      this.openModal('admin-detail-modal');
    },

    handleAdminUpdate(e) {
      e.preventDefault();

      const editId = document.getElementById('admin-edit-id').value;
      const complaint = state.complaints.find(c => c.id === editId);

      if (!complaint) {
        this.showToast('Unable to find complaint record.', 'danger');
        return;
      }

      // Read selected status
      const selectedStatusRadio = document.querySelector('input[name="admin-status"]:checked');
      if (!selectedStatusRadio) {
        this.showToast('Please select a valid status.', 'warning');
        return;
      }

      const newStatus = selectedStatusRadio.value;
      const newNote = document.getElementById('admin-resolution-note').value.trim();

      // Update record
      complaint.status = newStatus;
      complaint.adminNote = newNote;
      complaint.updatedAt = new Date().toISOString();

      this.saveStorage();
      this.closeModal('admin-detail-modal');

      // Refresh Dashboard components
      this.updateAdminKPIs();
      this.filterComplaints();
      this.renderQuickSampleTags();

      // If customer tracking is currently showing this ID, refresh it
      const trackInput = document.getElementById('track-search-input');
      if (trackInput && trackInput.value.trim().toUpperCase() === editId) {
        this.trackComplaint(editId);
      }

      this.showToast(`Updated ${editId} to "${newStatus}"!`, 'success');
    },

    // -----------------------------------------------------------------
    // Ticket Deletion Feature
    // -----------------------------------------------------------------
    openDeleteConfirmModal(complaintId) {
      state.pendingDeleteId = complaintId;
      const targetElem = document.getElementById('delete-target-id');
      if (targetElem) targetElem.textContent = complaintId;
      this.openModal('delete-confirm-modal');
    },

    executeDeleteTicket() {
      const id = state.pendingDeleteId;
      if (!id) return;

      const initialLength = state.complaints.length;
      state.complaints = state.complaints.filter(c => c.id !== id);

      if (state.complaints.length < initialLength) {
        this.saveStorage();
        this.closeModal('delete-confirm-modal');
        state.pendingDeleteId = null;

        // Refresh components
        this.updateAdminKPIs();
        this.filterComplaints();
        this.renderQuickSampleTags();

        // If currently displayed in tracking area, clear it
        const trackInput = document.getElementById('track-search-input');
        if (trackInput && trackInput.value.trim().toUpperCase() === id) {
          const resultArea = document.getElementById('tracking-result-area');
          if (resultArea) resultArea.classList.add('hidden');
        }

        this.showToast(`Ticket ${id} has been permanently deleted.`, 'warning');
      } else {
        this.showToast(`Ticket ${id} could not be found.`, 'danger');
        this.closeModal('delete-confirm-modal');
      }
    },

    // -----------------------------------------------------------------
    // JSON & CSV Export Features
    // -----------------------------------------------------------------
    exportToJSON() {
      if (state.complaints.length === 0) {
        this.showToast('No complaint records available to export.', 'warning');
        return;
      }

      const jsonStr = JSON.stringify(state.complaints, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `complaints_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('Complaints successfully exported to JSON!', 'success');
    },

    exportToCSV() {
      if (state.complaints.length === 0) {
        this.showToast('No complaint records available to export.', 'warning');
        return;
      }

      const headers = ['ID', 'Full Name', 'Email', 'Category', 'Subject', 'Rating', 'Status', 'Submitted Date', 'Admin Notes'];
      const rows = state.complaints.map(c => [
        `"${c.id}"`,
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.category || '').replace(/"/g, '""')}"`,
        `"${(c.subject || '').replace(/"/g, '""')}"`,
        c.rating,
        `"${c.status}"`,
        `"${c.createdAt}"`,
        `"${(c.adminNote || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `complaints_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('Complaints successfully exported to CSV!', 'success');
    },

    // -----------------------------------------------------------------
    // Modal Helpers
    // -----------------------------------------------------------------
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    closeModalOutside(event, modalId) {
      if (event.target.id === modalId) {
        this.closeModal(modalId);
      }
    },

    copyToClipboard(targetSelector, btnElem) {
      const target = document.querySelector(targetSelector);
      if (!target) return;

      const text = target.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btnElem.innerHTML;
        btnElem.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        btnElem.style.color = '#059669';
        setTimeout(() => {
          btnElem.innerHTML = originalText;
          btnElem.style.color = '';
        }, 2000);
        this.showToast(`Complaint ID ${text} copied to clipboard!`, 'info');
      }).catch(err => {
        console.error('Copy failed: ', err);
      });
    },

    // -----------------------------------------------------------------
    // Toast Notification System
    // -----------------------------------------------------------------
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      let icon = 'fa-circle-info';
      if (type === 'success') icon = 'fa-circle-check';
      else if (type === 'warning') icon = 'fa-triangle-exclamation';
      else if (type === 'danger') icon = 'fa-circle-xmark';

      toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-closing');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
      }, 3500);
    },

    // -----------------------------------------------------------------
    // HTML Utility Helpers
    // -----------------------------------------------------------------
    generateStatusBadgeHtml(status) {
      if (status === 'Pending') {
        return '<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>';
      } else if (status === 'In Progress') {
        return '<span class="badge badge-progress"><i class="fa-solid fa-arrows-rotate"></i> In Progress</span>';
      } else if (status === 'Resolved') {
        return '<span class="badge badge-resolved"><i class="fa-solid fa-circle-check"></i> Resolved</span>';
      }
      return `<span class="badge">${this.escapeHtml(status)}</span>`;
    },

    generateStarsHtml(rating) {
      let stars = '';
      const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
      for (let i = 1; i <= 5; i++) {
        if (i <= r) {
          stars += '<i class="fa-solid fa-star"></i>';
        } else {
          stars += '<i class="fa-regular fa-star" style="color:#cbd5e1;"></i>';
        }
      }
      return stars;
    },

    formatDate(isoStr) {
      if (!isoStr) return '-';
      try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return isoStr;
      }
    },

    formatShortDate(isoStr) {
      if (!isoStr) return '-';
      try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (e) {
        return isoStr;
      }
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    setupEventListeners() {
      // ESC key closes modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeModal('success-modal');
          this.closeModal('admin-detail-modal');
          this.closeModal('admin-login-modal');
          this.closeModal('delete-confirm-modal');
        }
      });

      // Hover feedback for rating buttons
      const ratingContainer = document.getElementById('star-rating-container');
      if (ratingContainer) {
        const btns = ratingContainer.querySelectorAll('.star-btn');
        btns.forEach((btn, idx) => {
          btn.addEventListener('mouseenter', () => {
            btns.forEach((b, i) => {
              if (i <= idx) b.classList.add('hovered');
              else b.classList.remove('hovered');
            });
            const ratingLabel = document.getElementById('rating-label');
            if (ratingLabel) ratingLabel.textContent = RATING_DESCRIPTIONS[idx + 1];
          });
        });

        ratingContainer.addEventListener('mouseleave', () => {
          btns.forEach(b => b.classList.remove('hovered'));
          const ratingLabel = document.getElementById('rating-label');
          if (ratingLabel) {
            ratingLabel.textContent = RATING_DESCRIPTIONS[state.selectedRating] || 'Select a rating';
          }
        });
      }
    }
  };

  // Bootstrap when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
  });

})();
