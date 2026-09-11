/**
 * LesKita SaaS - Google Apps Script backend.
 *
 * Cara mulai:
 * 1. Buat project Apps Script baru dan tambahkan Code.gs + Index.html.
 * 2. Ganti OWNER_EMAIL bila perlu, lalu jalankan setupApplication() sekali.
 * 3. Deploy sebagai Web app: Execute as "Me" / pemilik script.
 * 4. Who has access: Anyone (untuk login internal email + password).
 *
 * Biaya les guru-orang tua hanya dicatat. Modul Subscriptions khusus untuk
 * langganan guru kepada pemilik SaaS.
 */

const APP = Object.freeze({
  NAME: 'LesKita',
  VERSION: '2.0.1',
  OWNER_EMAIL: 'infoprivigo@gmail.com',
  INITIAL_ADMIN_PASSWORD: 'Admin123!',
  SESSION_HOURS: 168,
  DB_PROPERTY: 'LESKITA_SPREADSHEET_ID',
  OWNER_PROPERTY: 'LESKITA_OWNER_EMAIL',
  TZ: Session.getScriptTimeZone() || 'Asia/Jakarta',
  PLATFORM_TENANT: '__platform__',
  ROLES: Object.freeze({ ADMIN: 'ADMIN', TEACHER: 'TEACHER', PARENT: 'PARENT' }),
  SHEETS: Object.freeze({
    TENANTS: 'Tenants', USERS: 'Users', STUDENTS: 'Students', STUDENT_APPLICATIONS: 'StudentApplications', CLASSES: 'Classes',
    CLASS_MEMBERS: 'ClassMembers', SCHEDULE_RULES: 'ScheduleRules', SESSIONS: 'Sessions',
    ATTENDANCE: 'Attendance', PRICING_PROFILES: 'PricingProfiles', PRICING_TIERS: 'PricingTiers',
    REPORTS: 'Reports', FEES: 'Fees', SUBSCRIPTIONS: 'Subscriptions',
    SETTINGS: 'TeacherSettings', PLANS: 'Plans', AUTH_SESSIONS: 'AuthSessions', AUDIT: 'AuditLog'
  })
});

const SCHEMA = Object.freeze({
  Tenants: ['tenant_id', 'teacher_user_id', 'workspace_name', 'status', 'plan_id', 'trial_end', 'created_at', 'updated_at'],
  Users: ['user_id', 'tenant_id', 'email', 'name', 'role', 'status', 'created_at', 'updated_at', 'password_hash', 'password_salt', 'must_change_password', 'last_login_at'],
  Students: ['student_id', 'tenant_id', 'name', 'parent_name', 'parent_email', 'phone', 'school', 'grade', 'subject', 'fee_type', 'fee_amount', 'fee_due_day', 'status', 'created_at', 'updated_at', 'nickname', 'birth_date', 'gender', 'address', 'student_phone', 'parent_relation', 'parent_phone', 'emergency_phone', 'learning_goal', 'learning_notes', 'start_date'],
  StudentApplications: ['application_id', 'tenant_id', 'form_token', 'student_name', 'nickname', 'birth_date', 'address', 'student_phone', 'school', 'grade', 'subject', 'parent_name', 'parent_relation', 'parent_phone', 'parent_email', 'learning_goal', 'preferred_schedule', 'notes', 'status', 'submitted_at', 'reviewed_at'],
  Classes: ['class_id', 'tenant_id', 'name', 'class_type', 'subject', 'default_fee_type', 'default_fee_amount', 'duration_minutes', 'location', 'status', 'created_at', 'updated_at', 'pricing_profile_id'],
  ClassMembers: ['member_id', 'tenant_id', 'class_id', 'student_id', 'fee_type', 'fee_amount', 'status', 'joined_at', 'updated_at'],
  ScheduleRules: ['rule_id', 'tenant_id', 'class_id', 'day_of_week', 'start_time', 'duration_minutes', 'effective_from', 'effective_until', 'status', 'created_at', 'updated_at'],
  Sessions: ['session_id', 'tenant_id', 'student_id', 'start_at', 'duration_minutes', 'subject', 'location', 'status', 'created_at', 'updated_at', 'class_id', 'schedule_rule_id'],
  Attendance: ['attendance_id', 'tenant_id', 'session_id', 'student_id', 'status', 'billable', 'note', 'created_at', 'updated_at', 'present_count', 'pricing_tier_id', 'unit_price', 'charge_amount'],
  PricingProfiles: ['profile_id', 'tenant_id', 'name', 'scope', 'class_id', 'status', 'created_at', 'updated_at'],
  PricingTiers: ['tier_id', 'tenant_id', 'profile_id', 'min_attendees', 'max_attendees', 'price_per_student', 'status', 'created_at', 'updated_at'],
  Reports: ['report_id', 'tenant_id', 'session_id', 'student_id', 'material', 'progress', 'homework', 'score', 'teacher_note', 'published_at', 'created_at', 'updated_at', 'class_id'],
  Fees: ['fee_id', 'tenant_id', 'student_id', 'period', 'description', 'amount', 'due_date', 'status', 'paid_at', 'payment_note', 'created_at', 'updated_at', 'source_type', 'source_id', 'quantity', 'unit_amount', 'calculation_status', 'invoice_no', 'invoice_file_id', 'receipt_no', 'receipt_file_id'],
  Subscriptions: ['subscription_id', 'tenant_id', 'plan_id', 'status', 'started_at', 'renew_at', 'amount', 'provider_reference', 'created_at', 'updated_at'],
  TeacherSettings: ['setting_id', 'tenant_id', 'teacher_name', 'workspace_name', 'phone', 'payment_instructions', 'default_fee_type', 'default_fee_amount', 'default_due_day', 'updated_at', 'form_token', 'form_enabled', 'whatsapp_template'],
  Plans: ['plan_id', 'name', 'monthly_price', 'student_limit', 'status', 'created_at', 'updated_at'],
  AuthSessions: ['session_id', 'token_hash', 'user_id', 'expires_at', 'created_at', 'last_seen_at'],
  AuditLog: ['log_id', 'tenant_id', 'actor_email', 'action', 'entity', 'entity_id', 'payload_json', 'created_at']
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(APP.NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Jalankan manual untuk memastikan Index.html tersimpan lengkap. */
function verifyFrontend() {
  const html = HtmlService.createHtmlOutputFromFile('Index').getContent();
  const result = {
    version: APP.VERSION,
    characters: html.length,
    completeMarker: html.indexOf('LESKITA_INDEX_COMPLETE_2.0.1') !== -1,
    hasClosingScript: /<\/script>\s*<\/body>/i.test(html.replace(/<!--[\s\S]*?-->/g, ''))
  };
  console.log(JSON.stringify(result));
  if (!result.completeMarker || !result.hasClosingScript) {
    throw new Error('Index.html tidak lengkap. Ganti seluruh isinya dari file terbaru.');
  }
  return result;
}

/** Jalankan sekali secara manual dari editor Apps Script, tanpa parameter. */
function setupApplication() {
  const ownerEmail = normalizeEmail_(APP.OWNER_EMAIL);
  if (!ownerEmail) throw new Error('Masukkan email pemilik SaaS.');

  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(APP.DB_PROPERTY);
  let ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create(APP.NAME + ' Database');
    props.setProperty(APP.DB_PROPERTY, ss.getId());
  }
  props.setProperty(APP.OWNER_PROPERTY, ownerEmail);

  Object.keys(SCHEMA).forEach(name => ensureSheet_(ss, name, SCHEMA[name]));
  seedPlans_();

  const existing = findRows_(APP.SHEETS.USERS, row => normalizeEmail_(row.email) === ownerEmail && row.role === APP.ROLES.ADMIN)[0];
  if (!existing) {
    const credential = passwordCredential_(APP.INITIAL_ADMIN_PASSWORD);
    append_(APP.SHEETS.USERS, {
      user_id: id_('usr'), tenant_id: APP.PLATFORM_TENANT, email: ownerEmail,
      name: 'Pemilik SaaS', role: APP.ROLES.ADMIN, status: 'ACTIVE',
      password_hash: credential.hash, password_salt: credential.salt,
      must_change_password: true, last_login_at: '', created_at: now_(), updated_at: now_()
    });
  } else if (!existing.password_hash) {
    const credential = passwordCredential_(APP.INITIAL_ADMIN_PASSWORD);
    updateById_(APP.SHEETS.USERS, 'user_id', existing.user_id, {
      password_hash: credential.hash, password_salt: credential.salt,
      must_change_password: true, updated_at: now_()
    }, existing.tenant_id);
  }
  console.log('Login Admin: ' + ownerEmail + ' / ' + APP.INITIAL_ADMIN_PASSWORD);
  return { ok: true, spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), ownerEmail: ownerEmail, initialAdminPassword: APP.INITIAL_ADMIN_PASSWORD };
}

/** Single endpoint called by the SPA. */
function api(action, payload) {
  payload = payload || {};
  try {
    if (action === 'login') return { ok: true, data: login_(payload.data || {}), version: APP.VERSION };
    if (action === 'getPublicEnrollmentForm') return { ok: true, data: getPublicEnrollmentForm_(payload.data || {}), version: APP.VERSION };
    if (action === 'submitStudentApplication') return { ok: true, data: submitStudentApplication_(payload.data || {}), version: APP.VERSION };
    const ctx = getContextFromToken_(payload.authToken, payload.tenantId);
    const routes = {
      bootstrap: () => bootstrap_(ctx),
      dashboard: () => dashboard_(ctx),
      saveStudent: () => saveStudent_(ctx, payload.data),
      saveClass: () => saveClass_(ctx, payload.data),
      archiveClass: () => archiveClass_(ctx, payload.data),
      savePricingProfile: () => savePricingProfile_(ctx, payload.data),
      archivePricingProfile: () => archivePricingProfile_(ctx, payload.data),
      saveSession: () => saveSession_(ctx, payload.data),
      saveAttendance: () => saveAttendance_(ctx, payload.data),
      saveReport: () => saveReport_(ctx, payload.data),
      saveFee: () => saveFee_(ctx, payload.data),
      syncAutomaticFees: () => syncAutomaticFees_(ctx, payload.data && payload.data.period),
      generateFeeDocument: () => generateFeeDocument_(ctx, payload.data),
      downloadFeeDocument: () => downloadFeeDocument_(ctx, payload.data),
      updateFeeStatus: () => updateFeeStatus_(ctx, payload.data),
      saveTeacherSettings: () => saveTeacherSettings_(ctx, payload.data),
      getEnrollmentFormLink: () => getEnrollmentFormLink_(ctx),
      approveStudentApplication: () => approveStudentApplication_(ctx, payload.data),
      rejectStudentApplication: () => rejectStudentApplication_(ctx, payload.data),
      inviteParent: () => inviteParent_(ctx, payload.data),
      createTeacher: () => createTeacher_(ctx, payload.data),
      resetTeacherPassword: () => resetTeacherPassword_(ctx, payload.data),
      savePlan: () => savePlan_(ctx, payload.data),
      archivePlan: () => archivePlan_(ctx, payload.data),
      updateTenantStatus: () => updateTenantStatus_(ctx, payload.data),
      changePassword: () => changePassword_(ctx, payload.data),
      logout: () => logout_(ctx, payload.authToken),
      switchTenant: () => bootstrap_(getContextFromToken_(payload.authToken, payload.data && payload.data.tenantId))
    };
    if (!routes[action]) throw new Error('Aksi tidak dikenal: ' + action);
    return { ok: true, data: routes[action](), version: APP.VERSION };
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return { ok: false, error: error.message || String(error), version: APP.VERSION };
  }
}

function bootstrap_(ctx) {
  const email = normalizeEmail_(ctx.user.email);
  const memberships = findRows_(APP.SHEETS.USERS, row =>
    normalizeEmail_(row.email) === email && row.status === 'ACTIVE'
  ).map(publicUser_);
  return {
    authenticated: true, authorized: true, email: email, appName: APP.NAME,
    user: publicUser_(ctx.user), memberships: memberships,
    workspace: ctx.role === APP.ROLES.ADMIN ? { name: 'Platform Admin' } : publicTenant_(getById_(APP.SHEETS.TENANTS, 'tenant_id', ctx.tenantId)),
    dashboard: dashboard_(ctx)
  };
}

function login_(input) {
  const email = normalizeEmail_(input.email);
  const password = String(input.password || '');
  if (!email || !password) throw new Error('Email dan password wajib diisi.');
  const users = findRows_(APP.SHEETS.USERS, row => normalizeEmail_(row.email) === email && row.status === 'ACTIVE');
  const user = users.find(row => verifyPassword_(password, row.password_salt, row.password_hash));
  if (!user) throw new Error('Email atau password salah.');
  if (user.role !== APP.ROLES.ADMIN) {
    const tenant = getById_(APP.SHEETS.TENANTS, 'tenant_id', user.tenant_id);
    if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') throw new Error('Workspace sedang tidak aktif.');
  }
  const rawToken = id_('token') + Utilities.getUuid().replace(/-/g, '');
  append_(APP.SHEETS.AUTH_SESSIONS, {
    session_id: id_('auth'), token_hash: hashText_(rawToken), user_id: user.user_id,
    expires_at: addHours_(new Date(), APP.SESSION_HOURS), created_at: now_(), last_seen_at: now_()
  });
  updateById_(APP.SHEETS.USERS, 'user_id', user.user_id, { last_login_at: now_(), updated_at: now_() }, user.tenant_id);
  const ctx = getContextFromToken_(rawToken, user.tenant_id);
  return { token: rawToken, bootstrap: bootstrap_(ctx) };
}

function changePassword_(ctx, input) {
  input = input || {};
  const current = String(input.current_password || '');
  const next = String(input.new_password || '');
  if (!verifyPassword_(current, ctx.user.password_salt, ctx.user.password_hash)) throw new Error('Password saat ini salah.');
  validatePassword_(next);
  const credential = passwordCredential_(next);
  const sameEmail = findRows_(APP.SHEETS.USERS, u => normalizeEmail_(u.email) === normalizeEmail_(ctx.user.email));
  sameEmail.forEach(u => updateById_(APP.SHEETS.USERS, 'user_id', u.user_id, {
    password_hash: credential.hash, password_salt: credential.salt,
    must_change_password: false, updated_at: now_()
  }, u.tenant_id));
  ctx.user = getById_(APP.SHEETS.USERS, 'user_id', ctx.user.user_id);
  audit_(ctx, 'CHANGE_PASSWORD', 'User', ctx.user.user_id, {});
  return bootstrap_(ctx);
}

function logout_(ctx, rawToken) {
  const session = findRows_(APP.SHEETS.AUTH_SESSIONS, s => s.token_hash === hashText_(rawToken))[0];
  if (session) updateById_(APP.SHEETS.AUTH_SESSIONS, 'session_id', session.session_id, { expires_at: now_(), last_seen_at: now_() });
  return { loggedOut: true };
}

function dashboard_(ctx) {
  if (ctx.role === APP.ROLES.ADMIN) return adminDashboard_(ctx);
  if (ctx.role === APP.ROLES.TEACHER) return teacherDashboard_(ctx);
  return parentDashboard_(ctx);
}

function adminDashboard_(ctx) {
  requireRole_(ctx, APP.ROLES.ADMIN);
  const tenants = all_(APP.SHEETS.TENANTS).map(t => {
    const teacher = getById_(APP.SHEETS.USERS, 'user_id', t.teacher_user_id) || {};
    const studentCount = findRows_(APP.SHEETS.STUDENTS, s => s.tenant_id === t.tenant_id && s.status === 'ACTIVE').length;
    return Object.assign(publicTenant_(t), { teacher_name: teacher.name || '-', teacher_email: teacher.email || '-', student_count: studentCount });
  });
  const active = tenants.filter(t => t.status === 'ACTIVE').length;
  const trial = tenants.filter(t => t.status === 'TRIAL').length;
  const suspended = tenants.filter(t => t.status === 'SUSPENDED').length;
  return { role: ctx.role, stats: { totalTeachers: tenants.length, active: active, trial: trial, suspended: suspended }, tenants: tenants, plans: all_(APP.SHEETS.PLANS) };
}

function teacherDashboard_(ctx) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  const students = tenantRows_(APP.SHEETS.STUDENTS, ctx).sort(sortBy_('name'));
  const classes = tenantRows_(APP.SHEETS.CLASSES, ctx).sort(sortBy_('name'));
  const classMembers = tenantRows_(APP.SHEETS.CLASS_MEMBERS, ctx);
  const scheduleRules = tenantRows_(APP.SHEETS.SCHEDULE_RULES, ctx);
  const sessions = tenantRows_(APP.SHEETS.SESSIONS, ctx).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const attendance = tenantRows_(APP.SHEETS.ATTENDANCE, ctx);
  const pricingProfiles = tenantRows_(APP.SHEETS.PRICING_PROFILES, ctx);
  const pricingTiers = tenantRows_(APP.SHEETS.PRICING_TIERS, ctx);
  const applications = tenantRows_(APP.SHEETS.STUDENT_APPLICATIONS, ctx).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  const reports = tenantRows_(APP.SHEETS.REPORTS, ctx).sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
  const fees = tenantRows_(APP.SHEETS.FEES, ctx).sort((a, b) => String(b.period).localeCompare(String(a.period)));
  const settings = tenantRows_(APP.SHEETS.SETTINGS, ctx)[0] || defaultSettings_(ctx);
  const today = new Date();
  const upcomingAll = sessions.filter(s => new Date(s.start_at) >= today && s.status !== 'CANCELLED');
  const upcoming = upcomingAll.slice(0, 8);
  const unpaid = fees.filter(f => f.status !== 'PAID');
  const missingReports = sessions.filter(s => s.status === 'DONE').reduce((total, s) => {
    const targetIds = s.class_id
      ? classMembers.filter(m => m.class_id === s.class_id && m.status === 'ACTIVE').map(m => m.student_id)
      : [s.student_id].filter(Boolean);
    return total + targetIds.filter(studentId => !reports.some(r => r.session_id === s.session_id && r.student_id === studentId)).length;
  }, 0);
  return {
    role: ctx.role,
    stats: {
      activeStudents: students.filter(s => s.status === 'ACTIVE').length,
      upcomingSessions: upcomingAll.length,
      unpublishedReports: missingReports,
      unpaidTotal: sum_(unpaid, 'amount')
    },
    students: students, classes: classes, classMembers: classMembers, scheduleRules: scheduleRules,
    sessions: sessions, upcoming: upcoming, attendance: attendance,
    pricingProfiles: pricingProfiles, pricingTiers: pricingTiers, applications: applications,
    reports: reports, fees: fees,
    settings: settings, subscription: tenantRows_(APP.SHEETS.SUBSCRIPTIONS, ctx)[0] || null
  };
}

function parentDashboard_(ctx) {
  requireRole_(ctx, APP.ROLES.PARENT);
  const email = normalizeEmail_(ctx.user.email);
  const students = tenantRows_(APP.SHEETS.STUDENTS, ctx).filter(s => normalizeEmail_(s.parent_email) === email && s.status === 'ACTIVE');
  const ids = new Set(students.map(s => s.student_id));
  const classMembers = tenantRows_(APP.SHEETS.CLASS_MEMBERS, ctx).filter(m => ids.has(m.student_id) && m.status === 'ACTIVE');
  const classIds = new Set(classMembers.map(m => m.class_id));
  const classes = tenantRows_(APP.SHEETS.CLASSES, ctx).filter(c => classIds.has(c.class_id));
  const sessions = tenantRows_(APP.SHEETS.SESSIONS, ctx).filter(s => ids.has(s.student_id) || classIds.has(s.class_id)).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const reports = tenantRows_(APP.SHEETS.REPORTS, ctx).filter(r => ids.has(r.student_id) && r.published_at).sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  const attendance = tenantRows_(APP.SHEETS.ATTENDANCE, ctx).filter(a => ids.has(a.student_id));
  const fees = tenantRows_(APP.SHEETS.FEES, ctx).filter(f => ids.has(f.student_id)).sort((a, b) => String(b.period).localeCompare(String(a.period)));
  const settings = tenantRows_(APP.SHEETS.SETTINGS, ctx)[0] || {};
  return {
    role: ctx.role, students: students, classes: classes, classMembers: classMembers, sessions: sessions, attendance: attendance, reports: reports, fees: fees,
    settings: publicSettings_(settings),
    stats: {
      upcomingSessions: sessions.filter(s => new Date(s.start_at) >= new Date() && s.status !== 'CANCELLED').length,
      publishedReports: reports.length,
      unpaidTotal: sum_(fees.filter(f => f.status !== 'PAID'), 'amount')
    }
  };
}

function saveStudent_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['name', 'parent_name', 'parent_email', 'subject']);
  if (!input.student_id) {
    const tenant = getById_(APP.SHEETS.TENANTS, 'tenant_id', ctx.tenantId);
    const plan = tenant && getById_(APP.SHEETS.PLANS, 'plan_id', tenant.plan_id);
    const activeCount = tenantRows_(APP.SHEETS.STUDENTS, ctx).filter(s => s.status === 'ACTIVE').length;
    if (plan && activeCount >= Number(plan.student_limit || 0)) throw new Error('Batas murid paket ' + plan.name + ' sudah tercapai.');
  }
  const now = now_();
  const record = {
    student_id: input.student_id || id_('std'), tenant_id: ctx.tenantId,
    name: clean_(input.name), parent_name: clean_(input.parent_name), parent_email: normalizeEmail_(input.parent_email),
    phone: clean_(input.phone), school: clean_(input.school), grade: clean_(input.grade), subject: clean_(input.subject),
    fee_type: enum_(input.fee_type || 'MONTHLY', ['MONTHLY', 'PER_SESSION']), fee_amount: money_(input.fee_amount),
    fee_due_day: intRange_(input.fee_due_day || 10, 1, 28), status: enum_(input.status || 'ACTIVE', ['ACTIVE', 'INACTIVE']),
    created_at: input.created_at || now, updated_at: now,
    nickname: clean_(input.nickname), birth_date: isoDateOnlyOptional_(input.birth_date),
    gender: clean_(input.gender), address: clean_(input.address), student_phone: cleanPhone_(input.student_phone),
    parent_relation: clean_(input.parent_relation), parent_phone: cleanPhone_(input.parent_phone || input.phone),
    emergency_phone: cleanPhone_(input.emergency_phone), learning_goal: clean_(input.learning_goal),
    learning_notes: clean_(input.learning_notes), start_date: isoDateOnlyOptional_(input.start_date)
  };
  upsertTenantRecord_(APP.SHEETS.STUDENTS, 'student_id', record, ctx);
  audit_(ctx, 'SAVE_STUDENT', 'Student', record.student_id, record);
  return teacherDashboard_(ctx);
}

function saveClass_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['name', 'class_type', 'subject', 'effective_from', 'effective_until', 'start_time']);
  const memberIds = Array.isArray(input.members) ? input.members.filter(Boolean) : [];
  const days = Array.isArray(input.days) ? input.days.map(Number).filter(d => d >= 0 && d <= 6) : [];
  if (!memberIds.length) throw new Error('Pilih minimal satu murid.');
  if (input.class_type === 'INDIVIDUAL' && memberIds.length !== 1) throw new Error('Kelas individu harus memiliki tepat satu murid.');
  if (input.class_type === 'GROUP' && memberIds.length < 2) throw new Error('Kelas kelompok minimal memiliki dua murid.');
  if (!days.length) throw new Error('Pilih minimal satu hari belajar.');
  memberIds.forEach(id => assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', id, ctx));
  const start = new Date(input.effective_from + 'T00:00:00');
  const end = new Date(input.effective_until + 'T00:00:00');
  if (isNaN(start) || isNaN(end) || end < start) throw new Error('Periode jadwal tidak valid.');
  if ((end - start) / 86400000 > 366) throw new Error('Periode jadwal maksimal 12 bulan.');

  const now = now_();
  const classId = input.class_id || id_('cls');
  const record = {
    class_id: classId, tenant_id: ctx.tenantId, name: clean_(input.name),
    class_type: enum_(input.class_type, ['INDIVIDUAL', 'GROUP']), subject: clean_(input.subject),
    default_fee_type: enum_(input.default_fee_type || 'PER_SESSION', ['MONTHLY', 'PER_SESSION']),
    default_fee_amount: money_(input.default_fee_amount), duration_minutes: intRange_(input.duration_minutes || 90, 15, 480),
    location: clean_(input.location), status: 'ACTIVE', created_at: input.created_at || now, updated_at: now,
    pricing_profile_id: clean_(input.pricing_profile_id)
  };
  upsertTenantRecord_(APP.SHEETS.CLASSES, 'class_id', record, ctx);

  const existingMembers = tenantRows_(APP.SHEETS.CLASS_MEMBERS, ctx).filter(m => m.class_id === classId);
  existingMembers.filter(m => !memberIds.includes(m.student_id) && m.status === 'ACTIVE').forEach(m =>
    updateById_(APP.SHEETS.CLASS_MEMBERS, 'member_id', m.member_id, { status: 'INACTIVE', updated_at: now }, ctx.tenantId)
  );
  memberIds.forEach(studentId => {
    const old = existingMembers.find(m => m.student_id === studentId);
    const feeOverride = input.member_fees && input.member_fees[studentId];
    const member = {
      member_id: old ? old.member_id : id_('mem'), tenant_id: ctx.tenantId, class_id: classId, student_id: studentId,
      fee_type: feeOverride && feeOverride.fee_type ? enum_(feeOverride.fee_type, ['MONTHLY', 'PER_SESSION']) : record.default_fee_type,
      fee_amount: feeOverride && Number(feeOverride.fee_amount) > 0 ? money_(feeOverride.fee_amount) : record.default_fee_amount,
      status: 'ACTIVE', joined_at: old ? old.joined_at : now, updated_at: now
    };
    upsertTenantRecord_(APP.SHEETS.CLASS_MEMBERS, 'member_id', member, ctx);
  });

  const oldRules = tenantRows_(APP.SHEETS.SCHEDULE_RULES, ctx).filter(r => r.class_id === classId && r.status === 'ACTIVE');
  oldRules.forEach(r => updateById_(APP.SHEETS.SCHEDULE_RULES, 'rule_id', r.rule_id, { status: 'INACTIVE', updated_at: now }, ctx.tenantId));
  const oldRuleIds = new Set(oldRules.map(r => r.rule_id));
  const oldFutureSessions = tenantRows_(APP.SHEETS.SESSIONS, ctx)
    .filter(s => oldRuleIds.has(s.schedule_rule_id) && s.status === 'SCHEDULED' && new Date(s.start_at) >= new Date());
  oldFutureSessions.forEach(s => updateById_(APP.SHEETS.SESSIONS, 'session_id', s.session_id, { status: 'CANCELLED', updated_at: now }, ctx.tenantId));
  const rules = days.map(day => {
    const rule = {
      rule_id: id_('rul'), tenant_id: ctx.tenantId, class_id: classId, day_of_week: day,
      start_time: clean_(input.start_time), duration_minutes: record.duration_minutes,
      effective_from: isoDateOnly_(input.effective_from), effective_until: isoDateOnly_(input.effective_until),
      status: 'ACTIVE', created_at: now, updated_at: now
    };
    append_(APP.SHEETS.SCHEDULE_RULES, rule);
    return rule;
  });
  try {
    generateSessionsForRules_(ctx, record, rules);
  } catch (error) {
    rules.forEach(r => updateById_(APP.SHEETS.SCHEDULE_RULES, 'rule_id', r.rule_id, { status: 'INACTIVE', updated_at: now_() }, ctx.tenantId));
    oldRules.forEach(r => updateById_(APP.SHEETS.SCHEDULE_RULES, 'rule_id', r.rule_id, { status: 'ACTIVE', updated_at: now_() }, ctx.tenantId));
    oldFutureSessions.forEach(s => updateById_(APP.SHEETS.SESSIONS, 'session_id', s.session_id, { status: 'SCHEDULED', updated_at: now_() }, ctx.tenantId));
    throw error;
  }
  audit_(ctx, 'SAVE_CLASS', 'Class', classId, { members: memberIds, days: days });
  return teacherDashboard_(ctx);
}

function archiveClass_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  const klass = assertTenantEntity_(APP.SHEETS.CLASSES, 'class_id', input.class_id, ctx);
  updateById_(APP.SHEETS.CLASSES, 'class_id', klass.class_id, { status: 'ARCHIVED', updated_at: now_() }, ctx.tenantId);
  tenantRows_(APP.SHEETS.SCHEDULE_RULES, ctx).filter(r => r.class_id === klass.class_id && r.status === 'ACTIVE').forEach(r =>
    updateById_(APP.SHEETS.SCHEDULE_RULES, 'rule_id', r.rule_id, { status: 'INACTIVE', updated_at: now_() }, ctx.tenantId)
  );
  audit_(ctx, 'ARCHIVE_CLASS', 'Class', klass.class_id, {});
  return teacherDashboard_(ctx);
}

function savePricingProfile_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['name']);
  const tiers = Array.isArray(input.tiers) ? input.tiers.map(t => ({
    min: intRange_(t.min_attendees, 1, 1000), max: intRange_(t.max_attendees || t.min_attendees, 1, 1000),
    price: money_(t.price_per_student)
  })).sort((a, b) => a.min - b.min) : [];
  if (!tiers.length) throw new Error('Tambahkan minimal satu tingkatan tarif.');
  tiers.forEach((t, i) => {
    if (t.max < t.min) throw new Error('Batas maksimum peserta tidak valid.');
    if (i && t.min <= tiers[i - 1].max) throw new Error('Tingkatan tarif tidak boleh tumpang tindih.');
    if (i && t.min !== tiers[i - 1].max + 1) throw new Error('Tingkatan tarif harus berurutan tanpa celah.');
  });
  const scope = enum_(input.scope || 'GLOBAL', ['GLOBAL', 'CLASS']);
  if (scope === 'CLASS') assertTenantEntity_(APP.SHEETS.CLASSES, 'class_id', input.class_id, ctx);
  const now = now_();
  const profileId = input.profile_id || id_('prc');
  const record = {
    profile_id: profileId, tenant_id: ctx.tenantId, name: clean_(input.name), scope: scope,
    class_id: scope === 'CLASS' ? input.class_id : '', status: 'ACTIVE',
    created_at: input.created_at || now, updated_at: now
  };
  if (scope === 'GLOBAL') {
    tenantRows_(APP.SHEETS.PRICING_PROFILES, ctx)
      .filter(p => p.scope === 'GLOBAL' && p.status === 'ACTIVE' && p.profile_id !== profileId)
      .forEach(p => updateById_(APP.SHEETS.PRICING_PROFILES, 'profile_id', p.profile_id, { status: 'ARCHIVED', updated_at: now }, ctx.tenantId));
  }
  upsertTenantRecord_(APP.SHEETS.PRICING_PROFILES, 'profile_id', record, ctx);
  tenantRows_(APP.SHEETS.PRICING_TIERS, ctx).filter(t => t.profile_id === profileId && t.status === 'ACTIVE').forEach(t =>
    updateById_(APP.SHEETS.PRICING_TIERS, 'tier_id', t.tier_id, { status: 'INACTIVE', updated_at: now }, ctx.tenantId)
  );
  tiers.forEach(t => append_(APP.SHEETS.PRICING_TIERS, {
    tier_id: id_('tier'), tenant_id: ctx.tenantId, profile_id: profileId,
    min_attendees: t.min, max_attendees: t.max, price_per_student: t.price,
    status: 'ACTIVE', created_at: now, updated_at: now
  }));
  audit_(ctx, 'SAVE_PRICING_PROFILE', 'PricingProfile', profileId, { tiers: tiers });
  return teacherDashboard_(ctx);
}

function archivePricingProfile_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  const profile = assertTenantEntity_(APP.SHEETS.PRICING_PROFILES, 'profile_id', input.profile_id, ctx);
  updateById_(APP.SHEETS.PRICING_PROFILES, 'profile_id', profile.profile_id, { status: 'ARCHIVED', updated_at: now_() }, ctx.tenantId);
  audit_(ctx, 'ARCHIVE_PRICING_PROFILE', 'PricingProfile', profile.profile_id, {});
  return teacherDashboard_(ctx);
}

function resolvePricingTier_(ctx, klass, presentCount) {
  if (!klass || klass.class_type !== 'GROUP') return null;
  const profiles = tenantRows_(APP.SHEETS.PRICING_PROFILES, ctx);
  const explicit = klass.pricing_profile_id ? profiles.find(p => p.profile_id === klass.pricing_profile_id && p.status === 'ACTIVE') : null;
  const profile = explicit || profiles.find(p => p.scope === 'GLOBAL' && p.status === 'ACTIVE');
  if (!profile) return null;
  if (profile.status !== 'ACTIVE') return null;
  return tenantRows_(APP.SHEETS.PRICING_TIERS, ctx).find(t =>
    t.profile_id === profile.profile_id && t.status === 'ACTIVE' && presentCount >= Number(t.min_attendees) && presentCount <= Number(t.max_attendees)
  ) || null;
}

function generateSessionsForRules_(ctx, klass, rules) {
  const existing = tenantRows_(APP.SHEETS.SESSIONS, ctx);
  const candidates = [];
  rules.forEach(rule => {
    let cursor = new Date(rule.effective_from + 'T12:00:00');
    const end = new Date(rule.effective_until + 'T12:00:00');
    while (cursor <= end) {
      if (cursor.getDay() === Number(rule.day_of_week)) {
        const ymd = Utilities.formatDate(cursor, APP.TZ, 'yyyy-MM-dd');
        const startAt = isoDate_(ymd + 'T' + rule.start_time + ':00');
        const duplicate = existing.some(s => s.class_id === klass.class_id && String(s.start_at) === String(startAt) && s.status !== 'CANCELLED');
        if (!duplicate) {
          const candidateStart = new Date(startAt);
          const candidateEnd = new Date(candidateStart.getTime() + Number(rule.duration_minutes) * 60000);
          const conflict = existing.concat(candidates).find(s => {
            if (s.status === 'CANCELLED' || s.class_id === klass.class_id) return false;
            const otherStart = new Date(s.start_at);
            const otherEnd = new Date(otherStart.getTime() + Number(s.duration_minutes || 0) * 60000);
            return candidateStart < otherEnd && candidateEnd > otherStart;
          });
          if (conflict) throw new Error('Jadwal bentrok pada ' + Utilities.formatDate(candidateStart, APP.TZ, 'dd MMM yyyy HH:mm') + ' dengan kelas lain.');
          candidates.push({
            session_id: id_('ses'), tenant_id: ctx.tenantId, student_id: '', start_at: startAt,
            duration_minutes: rule.duration_minutes, subject: klass.subject, location: klass.location,
            status: 'SCHEDULED', created_at: now_(), updated_at: now_(),
            class_id: klass.class_id, schedule_rule_id: rule.rule_id
          });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  candidates.forEach(session => append_(APP.SHEETS.SESSIONS, session));
}

function saveSession_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['start_at']);
  let klass = null;
  if (input.class_id) klass = assertTenantEntity_(APP.SHEETS.CLASSES, 'class_id', input.class_id, ctx);
  else if (input.student_id) assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', input.student_id, ctx);
  else throw new Error('Pilih kelas atau murid.');
  const now = now_();
  const requestedStart = new Date(input.start_at);
  const requestedDuration = intRange_(input.duration_minutes || (klass && klass.duration_minutes) || 90, 15, 480);
  const requestedEnd = new Date(requestedStart.getTime() + requestedDuration * 60000);
  const conflict = tenantRows_(APP.SHEETS.SESSIONS, ctx).find(s => {
    if (s.session_id === input.session_id || s.status === 'CANCELLED') return false;
    const otherStart = new Date(s.start_at);
    const otherEnd = new Date(otherStart.getTime() + Number(s.duration_minutes || 0) * 60000);
    return requestedStart < otherEnd && requestedEnd > otherStart;
  });
  if (conflict) throw new Error('Jadwal bentrok dengan sesi ' + (conflict.subject || '') + ' pada ' + Utilities.formatDate(new Date(conflict.start_at), APP.TZ, 'dd MMM yyyy HH:mm') + '.');
  const record = {
    session_id: input.session_id || id_('ses'), tenant_id: ctx.tenantId, student_id: input.student_id || '',
    start_at: isoDate_(input.start_at), duration_minutes: requestedDuration,
    subject: clean_(input.subject || (klass && klass.subject)), location: clean_(input.location || (klass && klass.location)),
    status: enum_(input.status || 'SCHEDULED', ['SCHEDULED', 'DONE', 'CANCELLED']),
    created_at: input.created_at || now, updated_at: now, class_id: input.class_id || '', schedule_rule_id: input.schedule_rule_id || ''
  };
  upsertTenantRecord_(APP.SHEETS.SESSIONS, 'session_id', record, ctx);
  audit_(ctx, 'SAVE_SESSION', 'Session', record.session_id, record);
  return teacherDashboard_(ctx);
}

function saveAttendance_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  const session = assertTenantEntity_(APP.SHEETS.SESSIONS, 'session_id', input.session_id, ctx);
  if (session.class_id) {
    const period = periodFromDate_(session.start_at);
    const locked = tenantRows_(APP.SHEETS.FEES, ctx).some(f => f.status === 'PAID' && f.source_type === 'AUTOMATIC' && String(f.source_id).startsWith(session.class_id + ':') && String(f.source_id).endsWith(':' + period));
    if (locked) throw new Error('Presensi periode ini terkunci karena sudah ada pembayaran yang ditandai lunas.');
  }
  const entries = Array.isArray(input.entries) ? input.entries : [];
  if (!entries.length) throw new Error('Data presensi belum diisi.');
  const allowed = ['PRESENT', 'ABSENT_BILLABLE', 'ABSENT_FREE'];
  const presentCount = entries.filter(entry => String(entry.status || 'PRESENT').toUpperCase() === 'PRESENT').length;
  const klass = session.class_id ? assertTenantEntity_(APP.SHEETS.CLASSES, 'class_id', session.class_id, ctx) : null;
  const tier = resolvePricingTier_(ctx, klass, presentCount);
  const activeProfiles = tenantRows_(APP.SHEETS.PRICING_PROFILES, ctx).filter(p => p.status === 'ACTIVE');
  const hasPricingProfile = klass && klass.class_type === 'GROUP' && activeProfiles.some(p => p.profile_id === klass.pricing_profile_id || p.scope === 'GLOBAL');
  if (hasPricingProfile && !tier) throw new Error('Tidak ada tingkatan tarif untuk ' + presentCount + ' peserta hadir.');
  const members = tenantRows_(APP.SHEETS.CLASS_MEMBERS, ctx);
  entries.forEach(entry => {
    assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', entry.student_id, ctx);
    const status = enum_(entry.status || 'PRESENT', allowed);
    const member = session.class_id ? members.find(m => m.class_id === session.class_id && m.student_id === entry.student_id && m.status === 'ACTIVE') : null;
    const feeType = member ? member.fee_type : 'PER_SESSION';
    const basePrice = member ? Number(member.fee_amount || 0) : Number((klass && klass.default_fee_amount) || 0);
    const unitPrice = feeType === 'MONTHLY' ? 0 : Number(tier ? tier.price_per_student : basePrice);
    const billable = status !== 'ABSENT_FREE';
    const old = tenantRows_(APP.SHEETS.ATTENDANCE, ctx).find(a => a.session_id === session.session_id && a.student_id === entry.student_id);
    const record = {
      attendance_id: old ? old.attendance_id : id_('att'), tenant_id: ctx.tenantId,
      session_id: session.session_id, student_id: entry.student_id, status: status,
      billable: billable, note: clean_(entry.note),
      created_at: old ? old.created_at : now_(), updated_at: now_(),
      present_count: presentCount, pricing_tier_id: tier ? tier.tier_id : '',
      unit_price: unitPrice, charge_amount: billable ? unitPrice : 0
    };
    upsertTenantRecord_(APP.SHEETS.ATTENDANCE, 'attendance_id', record, ctx);
  });
  updateById_(APP.SHEETS.SESSIONS, 'session_id', session.session_id, { status: 'DONE', updated_at: now_() }, ctx.tenantId);
  syncAutomaticFees_(ctx, periodFromDate_(session.start_at));
  audit_(ctx, 'SAVE_ATTENDANCE', 'Session', session.session_id, { count: entries.length });
  return teacherDashboard_(ctx);
}

function saveReport_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['session_id', 'material', 'progress']);
  const session = assertTenantEntity_(APP.SHEETS.SESSIONS, 'session_id', input.session_id, ctx);
  const studentId = input.student_id || session.student_id;
  if (!studentId) throw new Error('Pilih murid untuk laporan progres.');
  assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', studentId, ctx);
  if (session.class_id) {
    const member = tenantRows_(APP.SHEETS.CLASS_MEMBERS, ctx).find(m => m.class_id === session.class_id && m.student_id === studentId && m.status === 'ACTIVE');
    if (!member) throw new Error('Murid bukan anggota kelas ini.');
  }
  const existing = tenantRows_(APP.SHEETS.REPORTS, ctx).find(r => r.session_id === input.session_id && r.student_id === studentId);
  const now = now_();
  const record = {
    report_id: (existing && existing.report_id) || input.report_id || id_('rpt'), tenant_id: ctx.tenantId,
    session_id: session.session_id, student_id: studentId, material: clean_(input.material),
    progress: clean_(input.progress), homework: clean_(input.homework), score: optionalNumber_(input.score),
    teacher_note: clean_(input.teacher_note), published_at: input.publish === false ? '' : now,
    created_at: (existing && existing.created_at) || now, updated_at: now, class_id: session.class_id || ''
  };
  upsertTenantRecord_(APP.SHEETS.REPORTS, 'report_id', record, ctx);
  if (input.mark_done !== false) {
    updateById_(APP.SHEETS.SESSIONS, 'session_id', session.session_id, { status: 'DONE', updated_at: now }, ctx.tenantId);
    syncAutomaticFees_(ctx, periodFromDate_(session.start_at));
  }
  audit_(ctx, 'PUBLISH_REPORT', 'Report', record.report_id, record);
  return teacherDashboard_(ctx);
}

function saveFee_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['student_id', 'period', 'amount']);
  assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', input.student_id, ctx);
  const now = now_();
  const record = {
    fee_id: input.fee_id || id_('fee'), tenant_id: ctx.tenantId, student_id: input.student_id,
    period: clean_(input.period), description: clean_(input.description || 'Biaya les'), amount: money_(input.amount),
    due_date: isoDateOnly_(input.due_date), status: enum_(input.status || 'UNPAID', ['UNPAID', 'PARTIAL', 'PAID']),
    paid_at: input.status === 'PAID' ? (input.paid_at || now) : clean_(input.paid_at), payment_note: clean_(input.payment_note),
    created_at: input.created_at || now, updated_at: now,
    source_type: input.source_type || 'MANUAL', source_id: input.source_id || '',
    quantity: input.quantity || 1, unit_amount: input.unit_amount || money_(input.amount), calculation_status: input.calculation_status || 'FINAL',
    invoice_no: input.invoice_no || '', invoice_file_id: input.invoice_file_id || '', receipt_no: input.receipt_no || '', receipt_file_id: input.receipt_file_id || ''
  };
  upsertTenantRecord_(APP.SHEETS.FEES, 'fee_id', record, ctx);
  audit_(ctx, 'SAVE_FEE_RECORD', 'Fee', record.fee_id, record);
  return teacherDashboard_(ctx);
}

function syncAutomaticFees_(ctx, requestedPeriod) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  const period = requestedPeriod && /^\d{4}-\d{2}$/.test(requestedPeriod) ? requestedPeriod : Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM');
  const classes = tenantRows_(APP.SHEETS.CLASSES, ctx).filter(c => c.status === 'ACTIVE');
  const members = tenantRows_(APP.SHEETS.CLASS_MEMBERS, ctx).filter(m => m.status === 'ACTIVE');
  const rules = tenantRows_(APP.SHEETS.SCHEDULE_RULES, ctx);
  const sessions = tenantRows_(APP.SHEETS.SESSIONS, ctx).filter(s => s.class_id && periodFromDate_(s.start_at) === period && s.status === 'DONE');
  const attendance = tenantRows_(APP.SHEETS.ATTENDANCE, ctx);
  const students = tenantRows_(APP.SHEETS.STUDENTS, ctx);
  const existingFees = tenantRows_(APP.SHEETS.FEES, ctx);
  const now = now_();

  classes.forEach(klass => {
    const periodStart = period + '-01';
    const periodEnd = period + '-31';
    const overlaps = rules.some(r => r.class_id === klass.class_id && r.effective_from <= periodEnd && r.effective_until >= periodStart);
    if (!overlaps && !sessions.some(s => s.class_id === klass.class_id)) return;
    members.filter(m => m.class_id === klass.class_id).forEach(member => {
      const student = students.find(s => s.student_id === member.student_id);
      if (!student) return;
      const classSessions = sessions.filter(s => s.class_id === klass.class_id);
      let quantity = 1;
      let amount;
      let unitAmount = money_(member.fee_amount || klass.default_fee_amount);
      if (member.fee_type === 'PER_SESSION') {
        const billableRows = classSessions.map(s => attendance.find(a => a.session_id === s.session_id && a.student_id === member.student_id)).filter(row =>
          row && (row.billable === true || String(row.billable).toLowerCase() === 'true')
        );
        quantity = billableRows.length;
        amount = billableRows.reduce((total, row) => total + Number(row.charge_amount !== '' && row.charge_amount !== undefined ? row.charge_amount : unitAmount), 0);
        const prices = [...new Set(billableRows.map(row => Number(row.unit_price || unitAmount)))];
        unitAmount = prices.length === 1 ? prices[0] : 0;
      } else {
        amount = unitAmount;
      }
      /* Backward-compatible count for attendance created before charge snapshots. */
      if (member.fee_type === 'PER_SESSION' && quantity === 0) {
        quantity = classSessions.filter(s => {
          const row = attendance.find(a => a.session_id === s.session_id && a.student_id === member.student_id);
          return row && (row.billable === true || String(row.billable).toLowerCase() === 'true');
        }).length;
      }
      if (amount === undefined) amount = member.fee_type === 'PER_SESSION' ? quantity * unitAmount : unitAmount;
      const sourceId = [klass.class_id, member.student_id, period].join(':');
      const old = existingFees.find(f => f.source_type === 'AUTOMATIC' && f.source_id === sourceId);
      if (old && old.status === 'PAID') return;
      if (!old && amount === 0) return;
      let invoiceNo = old ? old.invoice_no : '';
      let invoiceFileId = old ? old.invoice_file_id : '';
      if (old && Number(old.amount) !== Number(amount)) {
        if (invoiceFileId) { try { DriveApp.getFileById(invoiceFileId).setTrashed(true); } catch (e) {} }
        invoiceNo = '';
        invoiceFileId = '';
      }
      const dueDay = intRange_(student.fee_due_day || 10, 1, 28);
      const record = {
        fee_id: old ? old.fee_id : id_('fee'), tenant_id: ctx.tenantId, student_id: member.student_id,
        period: period, description: klass.name + (member.fee_type === 'PER_SESSION' ? ' · ' + quantity + ' sesi' : ' · biaya bulanan'),
        amount: amount, due_date: period + '-' + String(dueDay).padStart(2, '0'),
        status: old ? old.status : 'UNPAID', paid_at: old ? old.paid_at : '', payment_note: old ? old.payment_note : '',
        created_at: old ? old.created_at : now, updated_at: now,
        source_type: 'AUTOMATIC', source_id: sourceId, quantity: quantity, unit_amount: unitAmount,
        calculation_status: 'ESTIMATE', invoice_no: invoiceNo, invoice_file_id: invoiceFileId,
        receipt_no: old ? old.receipt_no : '', receipt_file_id: old ? old.receipt_file_id : ''
      };
      upsertTenantRecord_(APP.SHEETS.FEES, 'fee_id', record, ctx);
    });
  });
  audit_(ctx, 'SYNC_AUTOMATIC_FEES', 'FeePeriod', period, {});
  return teacherDashboard_(ctx);
}

function updateFeeStatus_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  const fee = assertTenantEntity_(APP.SHEETS.FEES, 'fee_id', input.fee_id, ctx);
  const status = enum_(input.status, ['UNPAID', 'PARTIAL', 'PAID']);
  updateById_(APP.SHEETS.FEES, 'fee_id', fee.fee_id, {
    status: status, paid_at: status === 'PAID' ? now_() : '', payment_note: clean_(input.payment_note),
    calculation_status: status === 'PAID' ? 'FINAL' : (fee.calculation_status || 'FINAL'), updated_at: now_()
  }, ctx.tenantId);
  audit_(ctx, 'UPDATE_FEE_STATUS', 'Fee', fee.fee_id, { status: status });
  return teacherDashboard_(ctx);
}

function generateFeeDocument_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  const fee = assertTenantEntity_(APP.SHEETS.FEES, 'fee_id', input.fee_id, ctx);
  const type = enum_(input.type || 'INVOICE', ['INVOICE', 'RECEIPT']);
  if (type === 'RECEIPT' && fee.status !== 'PAID') throw new Error('Kuitansi hanya dapat dibuat untuk biaya yang sudah lunas.');
  const student = assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', fee.student_id, ctx);
  const settings = tenantRows_(APP.SHEETS.SETTINGS, ctx)[0] || defaultSettings_(ctx);
  const prefix = type === 'INVOICE' ? 'INV' : 'KWT';
  const existingNo = type === 'INVOICE' ? fee.invoice_no : fee.receipt_no;
  const number = existingNo || documentNumber_(ctx, prefix, fee.period);
  const doc = DocumentApp.create(prefix + ' ' + number);
  const body = doc.getBody();
  body.appendParagraph(settings.workspace_name || APP.NAME).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(type === 'INVOICE' ? 'INVOICE / CATATAN BIAYA LES' : 'KUITANSI PEMBAYARAN').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable([
    ['Nomor', number], ['Periode', fee.period], ['Siswa', student.name],
    ['Orang tua/wali', student.parent_name], ['Status', fee.status], ['Total', formatRupiah_(fee.amount)]
  ]);
  body.appendParagraph('Rincian').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  const details = feeAttendanceDetails_(ctx, fee);
  if (details.length) {
    const rows = [['Tanggal', 'Kehadiran sesi', 'Tarif', 'Jumlah']].concat(details.map(d => [d.date, d.presentCount + ' peserta hadir', formatRupiah_(d.unitPrice), formatRupiah_(d.amount)]));
    body.appendTable(rows);
  } else body.appendParagraph(fee.description + ' — ' + formatRupiah_(fee.amount));
  body.appendParagraph('Instruksi pembayaran: ' + (settings.payment_instructions || 'Hubungi guru.'));
  body.appendParagraph('Pembayaran dilakukan langsung kepada guru. LesKita hanya membantu pencatatan administrasi.');
  if (type === 'RECEIPT') body.appendParagraph('Diterima pada: ' + (fee.paid_at || now_()));
  doc.saveAndClose();
  const source = DriveApp.getFileById(doc.getId());
  const pdfBlob = source.getAs(MimeType.PDF).setName(number.replace(/\//g, '-') + '.pdf');
  const file = documentFolder_().createFile(pdfBlob);
  source.setTrashed(true);
  const patch = type === 'INVOICE'
    ? { invoice_no: number, invoice_file_id: file.getId(), updated_at: now_() }
    : { receipt_no: number, receipt_file_id: file.getId(), updated_at: now_() };
  updateById_(APP.SHEETS.FEES, 'fee_id', fee.fee_id, patch, ctx.tenantId);
  audit_(ctx, 'GENERATE_' + type, 'Fee', fee.fee_id, { number: number });
  return { dashboard: teacherDashboard_(ctx), file: filePayload_(file) };
}

function downloadFeeDocument_(ctx, input) {
  input = input || {};
  const fee = assertTenantEntity_(APP.SHEETS.FEES, 'fee_id', input.fee_id, ctx);
  if (ctx.role === APP.ROLES.PARENT) {
    const student = assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', fee.student_id, ctx);
    if (normalizeEmail_(student.parent_email) !== normalizeEmail_(ctx.user.email)) throw new Error('Akses dokumen ditolak.');
  }
  const type = enum_(input.type || 'INVOICE', ['INVOICE', 'RECEIPT']);
  const fileId = type === 'INVOICE' ? fee.invoice_file_id : fee.receipt_file_id;
  if (!fileId) throw new Error('Dokumen belum dibuat oleh guru.');
  return filePayload_(DriveApp.getFileById(fileId));
}

function feeAttendanceDetails_(ctx, fee) {
  if (fee.source_type !== 'AUTOMATIC' || !fee.source_id) return [];
  const parts = String(fee.source_id).split(':');
  const classId = parts[0];
  const sessions = tenantRows_(APP.SHEETS.SESSIONS, ctx).filter(s => s.class_id === classId && periodFromDate_(s.start_at) === fee.period && s.status === 'DONE');
  const attendance = tenantRows_(APP.SHEETS.ATTENDANCE, ctx);
  return sessions.map(s => {
    const a = attendance.find(row => row.session_id === s.session_id && row.student_id === fee.student_id);
    if (!a || !(a.billable === true || String(a.billable).toLowerCase() === 'true')) return null;
    return { date: Utilities.formatDate(new Date(s.start_at), APP.TZ, 'dd MMM yyyy'), presentCount: Number(a.present_count || 1), unitPrice: Number(a.unit_price || 0), amount: Number(a.charge_amount || a.unit_price || 0) };
  }).filter(Boolean);
}

function documentNumber_(ctx, prefix, period) {
  const count = tenantRows_(APP.SHEETS.FEES, ctx).filter(f => prefix === 'INV' ? f.invoice_no : f.receipt_no).length + 1;
  return prefix + '/' + String(period).replace('-', '/') + '/' + String(count).padStart(4, '0');
}

function documentFolder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('LESKITA_DOCUMENT_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) {}
  }
  const folder = DriveApp.createFolder(APP.NAME + ' Documents');
  props.setProperty('LESKITA_DOCUMENT_FOLDER_ID', folder.getId());
  return folder;
}

function filePayload_(file) {
  const blob = file.getBlob();
  return { name: file.getName(), mimeType: blob.getContentType() || 'application/pdf', base64: Utilities.base64Encode(blob.getBytes()) };
}

function saveTeacherSettings_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  const current = tenantRows_(APP.SHEETS.SETTINGS, ctx)[0] || defaultSettings_(ctx);
  const record = {
    setting_id: current.setting_id || id_('set'), tenant_id: ctx.tenantId,
    teacher_name: clean_(input.teacher_name || current.teacher_name), workspace_name: clean_(input.workspace_name || current.workspace_name),
    phone: clean_(input.phone), payment_instructions: clean_(input.payment_instructions),
    default_fee_type: enum_(input.default_fee_type || 'MONTHLY', ['MONTHLY', 'PER_SESSION']),
    default_fee_amount: money_(input.default_fee_amount), default_due_day: intRange_(input.default_due_day || 10, 1, 28), updated_at: now_(),
    form_token: current.form_token || '', form_enabled: input.form_enabled !== undefined ? boolean_(input.form_enabled) : current.form_enabled,
    whatsapp_template: clean_(input.whatsapp_template || current.whatsapp_template)
  };
  upsertTenantRecord_(APP.SHEETS.SETTINGS, 'setting_id', record, ctx);
  updateById_(APP.SHEETS.TENANTS, 'tenant_id', ctx.tenantId, { workspace_name: record.workspace_name, updated_at: now_() });
  audit_(ctx, 'SAVE_SETTINGS', 'TeacherSettings', record.setting_id, { workspace_name: record.workspace_name });
  return teacherDashboard_(ctx);
}

function inviteParent_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  input = input || {};
  requireFields_(input, ['student_id']);
  const student = assertTenantEntity_(APP.SHEETS.STUDENTS, 'student_id', input.student_id, ctx);
  const parentAccess = ensureParentMembership_(ctx, student.parent_name, student.parent_email, true);
  const url = ScriptApp.getService().getUrl();
  let emailSent = false;
  let warning = '';
  if (url && input.sendEmail !== false) {
    try {
      MailApp.sendEmail({
        to: student.parent_email,
        subject: 'Akses laporan belajar ' + student.name,
        htmlBody: '<p>Halo ' + escapeHtml_(student.parent_name) + ',</p><p>Anda diundang untuk melihat jadwal, progres, dan catatan biaya belajar ' + escapeHtml_(student.name) + '.</p><p><a href="' + url + '">Buka ' + APP.NAME + '</a></p><p>Password sementara: <b>' + escapeHtml_(parentAccess.temporaryPassword) + '</b></p><p>Pembayaran biaya les tetap dilakukan langsung kepada guru.</p>'
      });
      emailSent = true;
    } catch (error) {
      warning = 'Password berhasil dibuat, tetapi email gagal dikirim: ' + error.message;
    }
  }
  audit_(ctx, 'INVITE_PARENT', 'Student', student.student_id, { email: student.parent_email });
  return { dashboard: teacherDashboard_(ctx), temporaryPassword: parentAccess.temporaryPassword, parentEmail: student.parent_email, emailSent: emailSent, warning: warning };
}

function getEnrollmentFormLink_(ctx) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  let settings = tenantRows_(APP.SHEETS.SETTINGS, ctx)[0] || defaultSettings_(ctx);
  if (!settings.setting_id) settings.setting_id = id_('set');
  if (!settings.form_token) settings.form_token = Utilities.getUuid().replace(/-/g, '');
  settings.form_enabled = true;
  settings.updated_at = now_();
  upsertTenantRecord_(APP.SHEETS.SETTINGS, 'setting_id', settings, ctx);
  return { url: ScriptApp.getService().getUrl() + '?daftar=' + settings.form_token, token: settings.form_token, dashboard: teacherDashboard_(ctx) };
}

function getPublicEnrollmentForm_(input) {
  const token = clean_(input.token);
  const settings = findRows_(APP.SHEETS.SETTINGS, s => s.form_token === token && String(s.form_enabled).toLowerCase() === 'true')[0];
  if (!settings) throw new Error('Formulir tidak aktif atau tidak ditemukan.');
  return { token: token, workspaceName: settings.workspace_name, teacherName: settings.teacher_name, phone: settings.phone };
}

function submitStudentApplication_(input) {
  requireFields_(input, ['token', 'student_name', 'grade', 'subject', 'parent_name', 'parent_phone', 'parent_email']);
  const settings = findRows_(APP.SHEETS.SETTINGS, s => s.form_token === clean_(input.token) && String(s.form_enabled).toLowerCase() === 'true')[0];
  if (!settings) throw new Error('Formulir tidak aktif atau tidak ditemukan.');
  const duplicate = findRows_(APP.SHEETS.STUDENT_APPLICATIONS, a => a.tenant_id === settings.tenant_id && normalizeEmail_(a.parent_email) === normalizeEmail_(input.parent_email) && a.student_name === clean_(input.student_name) && a.status === 'NEW')[0];
  if (duplicate) throw new Error('Pendaftaran ini sudah pernah dikirim.');
  const record = {
    application_id: id_('app'), tenant_id: settings.tenant_id, form_token: settings.form_token,
    student_name: clean_(input.student_name), nickname: clean_(input.nickname), birth_date: isoDateOnlyOptional_(input.birth_date),
    address: clean_(input.address), student_phone: cleanPhone_(input.student_phone), school: clean_(input.school),
    grade: clean_(input.grade), subject: clean_(input.subject), parent_name: clean_(input.parent_name),
    parent_relation: clean_(input.parent_relation), parent_phone: cleanPhone_(input.parent_phone),
    parent_email: normalizeEmail_(input.parent_email), learning_goal: clean_(input.learning_goal),
    preferred_schedule: clean_(input.preferred_schedule), notes: clean_(input.notes), status: 'NEW',
    submitted_at: now_(), reviewed_at: ''
  };
  append_(APP.SHEETS.STUDENT_APPLICATIONS, record);
  return { submitted: true, applicationId: record.application_id };
}

function approveStudentApplication_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  const app = assertTenantEntity_(APP.SHEETS.STUDENT_APPLICATIONS, 'application_id', input.application_id, ctx);
  if (app.status !== 'NEW') throw new Error('Pendaftaran sudah diproses.');
  saveStudent_(ctx, {
    name: app.student_name, nickname: app.nickname, birth_date: app.birth_date, address: app.address,
    student_phone: app.student_phone, school: app.school, grade: app.grade, subject: app.subject,
    parent_name: app.parent_name, parent_relation: app.parent_relation, parent_phone: app.parent_phone,
    parent_email: app.parent_email, phone: app.parent_phone, learning_goal: app.learning_goal,
    learning_notes: app.notes, fee_type: input.fee_type || 'PER_SESSION', fee_amount: input.fee_amount || 0,
    fee_due_day: input.fee_due_day || 10, status: 'ACTIVE', start_date: now_().slice(0, 10)
  });
  updateById_(APP.SHEETS.STUDENT_APPLICATIONS, 'application_id', app.application_id, { status: 'APPROVED', reviewed_at: now_() }, ctx.tenantId);
  audit_(ctx, 'APPROVE_APPLICATION', 'StudentApplication', app.application_id, {});
  return teacherDashboard_(ctx);
}

function rejectStudentApplication_(ctx, input) {
  requireRole_(ctx, APP.ROLES.TEACHER);
  const app = assertTenantEntity_(APP.SHEETS.STUDENT_APPLICATIONS, 'application_id', input.application_id, ctx);
  updateById_(APP.SHEETS.STUDENT_APPLICATIONS, 'application_id', app.application_id, { status: 'REJECTED', reviewed_at: now_() }, ctx.tenantId);
  audit_(ctx, 'REJECT_APPLICATION', 'StudentApplication', app.application_id, {});
  return teacherDashboard_(ctx);
}

function createTeacher_(ctx, input) {
  requireRole_(ctx, APP.ROLES.ADMIN);
  input = input || {};
  requireFields_(input, ['name', 'email', 'workspace_name']);
  const email = normalizeEmail_(input.email);
  if (findRows_(APP.SHEETS.USERS, u => normalizeEmail_(u.email) === email && u.role === APP.ROLES.TEACHER).length) throw new Error('Email guru sudah terdaftar.');
  const now = now_();
  const tenantId = id_('tnt');
  const teacherId = id_('usr');
  const temporaryPassword = temporaryPassword_();
  const credential = passwordCredential_(temporaryPassword);
  append_(APP.SHEETS.USERS, {
    user_id: teacherId, tenant_id: tenantId, email: email, name: clean_(input.name),
    role: APP.ROLES.TEACHER, status: 'ACTIVE', password_hash: credential.hash,
    password_salt: credential.salt, must_change_password: true, last_login_at: '',
    created_at: now, updated_at: now
  });
  append_(APP.SHEETS.TENANTS, { tenant_id: tenantId, teacher_user_id: teacherId, workspace_name: clean_(input.workspace_name), status: 'TRIAL', plan_id: clean_(input.plan_id || 'starter'), trial_end: addDays_(new Date(), 14), created_at: now, updated_at: now });
  append_(APP.SHEETS.SUBSCRIPTIONS, { subscription_id: id_('sub'), tenant_id: tenantId, plan_id: clean_(input.plan_id || 'starter'), status: 'TRIAL', started_at: now, renew_at: addDays_(new Date(), 14), amount: 0, provider_reference: '', created_at: now, updated_at: now });
  append_(APP.SHEETS.SETTINGS, { setting_id: id_('set'), tenant_id: tenantId, teacher_name: clean_(input.name), workspace_name: clean_(input.workspace_name), phone: '', payment_instructions: '', default_fee_type: 'MONTHLY', default_fee_amount: 0, default_due_day: 10, updated_at: now });
  audit_(ctx, 'CREATE_TEACHER', 'Tenant', tenantId, { email: email });
  return { dashboard: adminDashboard_(ctx), temporaryPassword: temporaryPassword, teacherEmail: email };
}

function resetTeacherPassword_(ctx, input) {
  requireRole_(ctx, APP.ROLES.ADMIN);
  input = input || {};
  const tenant = getById_(APP.SHEETS.TENANTS, 'tenant_id', input.tenant_id);
  if (!tenant) throw new Error('Workspace tidak ditemukan.');
  const teacher = getById_(APP.SHEETS.USERS, 'user_id', tenant.teacher_user_id);
  if (!teacher) throw new Error('Akun guru tidak ditemukan.');
  const temporaryPassword = temporaryPassword_();
  const credential = passwordCredential_(temporaryPassword);
  updateById_(APP.SHEETS.USERS, 'user_id', teacher.user_id, {
    password_hash: credential.hash, password_salt: credential.salt,
    must_change_password: true, updated_at: now_()
  }, teacher.tenant_id);
  audit_(ctx, 'RESET_TEACHER_PASSWORD', 'User', teacher.user_id, { email: teacher.email });
  return { dashboard: adminDashboard_(ctx), temporaryPassword: temporaryPassword, teacherEmail: teacher.email };
}

function updateTenantStatus_(ctx, input) {
  requireRole_(ctx, APP.ROLES.ADMIN);
  input = input || {};
  const tenant = getById_(APP.SHEETS.TENANTS, 'tenant_id', input.tenant_id);
  if (!tenant) throw new Error('Workspace tidak ditemukan.');
  const status = enum_(input.status, ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']);
  updateById_(APP.SHEETS.TENANTS, 'tenant_id', tenant.tenant_id, { status: status, updated_at: now_() });
  const subscription = findRows_(APP.SHEETS.SUBSCRIPTIONS, s => s.tenant_id === tenant.tenant_id)[0];
  if (subscription) updateById_(APP.SHEETS.SUBSCRIPTIONS, 'subscription_id', subscription.subscription_id, { status: status, updated_at: now_() }, tenant.tenant_id);
  audit_(ctx, 'UPDATE_TENANT_STATUS', 'Tenant', tenant.tenant_id, { status: status });
  return adminDashboard_(ctx);
}

function savePlan_(ctx, input) {
  requireRole_(ctx, APP.ROLES.ADMIN);
  input = input || {};
  requireFields_(input, ['name', 'monthly_price', 'student_limit']);
  const now = now_();
  const planId = input.plan_id || ('plan_' + clean_(input.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + String(Date.now()).slice(-5));
  const record = {
    plan_id: planId, name: clean_(input.name), monthly_price: money_(input.monthly_price),
    student_limit: intRange_(input.student_limit, 1, 10000),
    status: enum_(input.status || 'ACTIVE', ['ACTIVE', 'ARCHIVED']),
    created_at: input.created_at || now, updated_at: now
  };
  upsert_(APP.SHEETS.PLANS, 'plan_id', record);
  audit_(ctx, 'SAVE_PLAN', 'Plan', planId, record);
  return adminDashboard_(ctx);
}

function archivePlan_(ctx, input) {
  requireRole_(ctx, APP.ROLES.ADMIN);
  const plan = getById_(APP.SHEETS.PLANS, 'plan_id', input.plan_id);
  if (!plan) throw new Error('Paket tidak ditemukan.');
  updateById_(APP.SHEETS.PLANS, 'plan_id', plan.plan_id, { status: 'ARCHIVED', updated_at: now_() });
  audit_(ctx, 'ARCHIVE_PLAN', 'Plan', plan.plan_id, {});
  return adminDashboard_(ctx);
}

// ---------------- Database and security helpers ----------------

function getContextFromToken_(rawToken, requestedTenantId) {
  if (!rawToken) throw new Error('Silakan login terlebih dahulu.');
  const session = findRows_(APP.SHEETS.AUTH_SESSIONS, s => s.token_hash === hashText_(rawToken))[0];
  if (!session || new Date(session.expires_at) <= new Date()) throw new Error('Sesi login telah berakhir. Silakan login kembali.');
  const sessionUser = getById_(APP.SHEETS.USERS, 'user_id', session.user_id);
  if (!sessionUser || sessionUser.status !== 'ACTIVE') throw new Error('Akun tidak aktif.');
  const email = normalizeEmail_(sessionUser.email);
  const memberships = findRows_(APP.SHEETS.USERS, u => normalizeEmail_(u.email) === email && u.status === 'ACTIVE');
  if (!memberships.length) throw new Error('Akun belum memiliki akses. Minta undangan dari guru atau admin.');
  let user = requestedTenantId ? memberships.find(u => u.tenant_id === requestedTenantId) : memberships.find(u => u.user_id === sessionUser.user_id);
  if (!user) throw new Error('Anda tidak memiliki akses ke workspace tersebut.');
  if (user.role !== APP.ROLES.ADMIN) {
    const tenant = getById_(APP.SHEETS.TENANTS, 'tenant_id', user.tenant_id);
    if (!tenant) throw new Error('Workspace tidak ditemukan.');
    if (tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') throw new Error('Workspace sedang tidak aktif.');
  }
  updateById_(APP.SHEETS.AUTH_SESSIONS, 'session_id', session.session_id, { last_seen_at: now_() });
  return { email: email, user: user, role: user.role, tenantId: user.tenant_id, sessionId: session.session_id };
}

function requireRole_(ctx, role) {
  if (!ctx || ctx.role !== role) throw new Error('Akses ditolak untuk role ini.');
}

function tenantRows_(sheet, ctx) {
  if (ctx.role === APP.ROLES.ADMIN) return all_(sheet);
  return findRows_(sheet, row => row.tenant_id === ctx.tenantId);
}

function assertTenantEntity_(sheet, key, id, ctx) {
  const row = getById_(sheet, key, id);
  if (!row || row.tenant_id !== ctx.tenantId) throw new Error('Data tidak ditemukan atau berada di workspace lain.');
  return row;
}

function upsertTenantRecord_(sheet, key, record, ctx) {
  if (record.tenant_id !== ctx.tenantId) throw new Error('Tenant tidak valid.');
  const existing = getById_(sheet, key, record[key]);
  if (existing && existing.tenant_id !== ctx.tenantId) throw new Error('Akses lintas tenant ditolak.');
  return upsert_(sheet, key, record);
}

function db_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP.DB_PROPERTY);
  if (!id) throw new Error('Aplikasi belum disiapkan. Jalankan setupApplication(emailPemilik) dari editor.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#dbe5ff');
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  headers.forEach((header, i) => {
    if (!current[i]) sheet.getRange(1, i + 1).setValue(header);
    else if (current[i] !== header) throw new Error('Header sheet ' + name + ' kolom ' + (i + 1) + ' harus: ' + header);
  });
  sheet.setFrozenRows(1);
  return sheet;
}

function sheet_(name) {
  const sheet = db_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  return sheet;
}

function all_(name) {
  const sheet = sheet_(name);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.filter(row => row.some(v => v !== '')).map((row, index) => {
    const obj = { _row: index + 2 };
    headers.forEach((h, i) => obj[h] = serializeCell_(row[i]));
    return obj;
  });
}

function findRows_(name, predicate) { return all_(name).filter(predicate); }
function getById_(name, key, value) { return all_(name).find(row => String(row[key]) === String(value)) || null; }

function append_(name, record) {
  return withLock_(() => {
    const sheet = sheet_(name);
    const headers = SCHEMA[name];
    sheet.appendRow(headers.map(h => record[h] === undefined ? '' : record[h]));
    return record;
  });
}

function upsert_(name, key, record) {
  return withLock_(() => {
    const sheet = sheet_(name);
    const rows = all_(name);
    const existing = rows.find(row => String(row[key]) === String(record[key]));
    const headers = SCHEMA[name];
    if (existing) {
      const merged = Object.assign({}, existing, record);
      sheet.getRange(existing._row, 1, 1, headers.length).setValues([headers.map(h => merged[h] === undefined ? '' : merged[h])]);
      return merged;
    }
    sheet.appendRow(headers.map(h => record[h] === undefined ? '' : record[h]));
    return record;
  });
}

function updateById_(name, key, value, patch, requiredTenantId) {
  return withLock_(() => {
    const sheet = sheet_(name);
    const row = getById_(name, key, value);
    if (!row) throw new Error('Data tidak ditemukan.');
    if (requiredTenantId && row.tenant_id !== requiredTenantId) throw new Error('Akses lintas tenant ditolak.');
    const merged = Object.assign({}, row, patch);
    const headers = SCHEMA[name];
    sheet.getRange(row._row, 1, 1, headers.length).setValues([headers.map(h => merged[h] === undefined ? '' : merged[h])]);
    return merged;
  });
}

function withLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return callback(); } finally { lock.releaseLock(); }
}

function ensureParentMembership_(ctx, name, email, forceReset) {
  email = normalizeEmail_(email);
  let exists = findRows_(APP.SHEETS.USERS, u => u.tenant_id === ctx.tenantId && normalizeEmail_(u.email) === email && u.role === APP.ROLES.PARENT)[0];
  if (forceReset) {
    const temporaryPassword = temporaryPassword_();
    const credential = passwordCredential_(temporaryPassword);
    if (exists) {
      exists = updateById_(APP.SHEETS.USERS, 'user_id', exists.user_id, {
        name: clean_(name), password_hash: credential.hash, password_salt: credential.salt,
        must_change_password: true, updated_at: now_()
      }, exists.tenant_id);
    } else {
      exists = append_(APP.SHEETS.USERS, {
        user_id: id_('usr'), tenant_id: ctx.tenantId, email: email, name: clean_(name),
        role: APP.ROLES.PARENT, status: 'ACTIVE', password_hash: credential.hash,
        password_salt: credential.salt, must_change_password: true, last_login_at: '',
        created_at: now_(), updated_at: now_()
      });
    }
    findRows_(APP.SHEETS.USERS, u => normalizeEmail_(u.email) === email && u.user_id !== exists.user_id).forEach(u =>
      updateById_(APP.SHEETS.USERS, 'user_id', u.user_id, {
        password_hash: credential.hash, password_salt: credential.salt,
        must_change_password: true, updated_at: now_()
      }, u.tenant_id)
    );
    return { user: exists, temporaryPassword: temporaryPassword };
  }
  if (exists && exists.password_hash) return { user: exists, temporaryPassword: '' };
  const shared = findRows_(APP.SHEETS.USERS, u => normalizeEmail_(u.email) === email && u.password_hash)[0];
  let temporaryPassword = '';
  let credential;
  if (shared) credential = { hash: shared.password_hash, salt: shared.password_salt };
  else {
    temporaryPassword = temporaryPassword_();
    credential = passwordCredential_(temporaryPassword);
  }
  if (exists) {
    exists = updateById_(APP.SHEETS.USERS, 'user_id', exists.user_id, {
      password_hash: credential.hash, password_salt: credential.salt,
      must_change_password: shared ? shared.must_change_password : true, updated_at: now_()
    }, exists.tenant_id);
  } else {
    exists = append_(APP.SHEETS.USERS, {
      user_id: id_('usr'), tenant_id: ctx.tenantId, email: email, name: clean_(name),
      role: APP.ROLES.PARENT, status: 'ACTIVE', password_hash: credential.hash,
      password_salt: credential.salt, must_change_password: shared ? shared.must_change_password : true,
      last_login_at: '', created_at: now_(), updated_at: now_()
    });
  }
  return { user: exists, temporaryPassword: temporaryPassword };
}

function seedPlans_() {
  const plans = [
    { plan_id: 'starter', name: 'Starter', monthly_price: 49000, student_limit: 10, status: 'ACTIVE' },
    { plan_id: 'pro', name: 'Pro', monthly_price: 99000, student_limit: 40, status: 'ACTIVE' }
  ];
  plans.forEach(p => {
    if (!getById_(APP.SHEETS.PLANS, 'plan_id', p.plan_id)) append_(APP.SHEETS.PLANS, Object.assign(p, { created_at: now_(), updated_at: now_() }));
  });
}

function audit_(ctx, action, entity, entityId, payload) {
  append_(APP.SHEETS.AUDIT, {
    log_id: id_('log'), tenant_id: ctx.tenantId, actor_email: ctx.email,
    action: action, entity: entity, entity_id: entityId,
    payload_json: JSON.stringify(payload || {}).slice(0, 40000), created_at: now_()
  });
}

// ---------------- Formatting and validation ----------------

function publicUser_(u) { return { user_id: u.user_id, tenant_id: u.tenant_id, email: u.email, name: u.name, role: u.role, must_change_password: String(u.must_change_password).toLowerCase() === 'true' }; }
function publicTenant_(t) { return t ? { tenant_id: t.tenant_id, workspace_name: t.workspace_name, status: t.status, plan_id: t.plan_id, trial_end: t.trial_end } : null; }
function publicSettings_(s) { return { teacher_name: s.teacher_name || '', workspace_name: s.workspace_name || '', phone: s.phone || '', payment_instructions: s.payment_instructions || '', form_token: s.form_token || '', form_enabled: String(s.form_enabled).toLowerCase() === 'true', whatsapp_template: s.whatsapp_template || '' }; }
function defaultSettings_(ctx) { return { setting_id: '', tenant_id: ctx.tenantId, teacher_name: ctx.user.name, workspace_name: ctx.user.name + ' Privat', phone: '', payment_instructions: '', default_fee_type: 'MONTHLY', default_fee_amount: 0, default_due_day: 10, form_token: '', form_enabled: false, whatsapp_template: '' }; }
function sum_(rows, key) { return rows.reduce((total, row) => total + Number(row[key] || 0), 0); }
function sortBy_(key) { return (a, b) => String(a[key] || '').localeCompare(String(b[key] || ''), 'id'); }
function id_(prefix) { return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 18); }
function now_() { return Utilities.formatDate(new Date(), APP.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function addDays_(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return Utilities.formatDate(d, APP.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function addHours_(date, hours) { const d = new Date(date); d.setHours(d.getHours() + hours); return Utilities.formatDate(d, APP.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function periodFromDate_(value) { const d = new Date(value); if (isNaN(d)) throw new Error('Tanggal sesi tidak valid.'); return Utilities.formatDate(d, APP.TZ, 'yyyy-MM'); }
function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function clean_(value) { return String(value === undefined || value === null ? '' : value).trim().slice(0, 5000); }
function money_(value) { const n = Number(value || 0); if (!Number.isFinite(n) || n < 0) throw new Error('Nominal tidak valid.'); return Math.round(n); }
function optionalNumber_(value) { if (value === '' || value === undefined || value === null) return ''; const n = Number(value); if (!Number.isFinite(n)) throw new Error('Nilai tidak valid.'); return n; }
function intRange_(value, min, max) { const n = parseInt(value, 10); if (!Number.isFinite(n) || n < min || n > max) throw new Error('Angka harus antara ' + min + ' dan ' + max + '.'); return n; }
function enum_(value, allowed) { value = String(value || '').toUpperCase(); if (!allowed.includes(value)) throw new Error('Pilihan tidak valid: ' + value); return value; }
function isoDate_(value) { const d = new Date(value); if (isNaN(d.getTime())) throw new Error('Tanggal dan waktu tidak valid.'); return Utilities.formatDate(d, APP.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function isoDateOnly_(value) { if (!value) return ''; const d = new Date(value + (String(value).length <= 10 ? 'T00:00:00' : '')); if (isNaN(d.getTime())) throw new Error('Tanggal tidak valid.'); return Utilities.formatDate(d, APP.TZ, 'yyyy-MM-dd'); }
function isoDateOnlyOptional_(value) { return value ? isoDateOnly_(value) : ''; }
function cleanPhone_(value) { return String(value || '').replace(/[^0-9+]/g, '').slice(0, 20); }
function boolean_(value) { return value === true || String(value).toLowerCase() === 'true' || String(value) === '1' || String(value).toLowerCase() === 'on'; }
function formatRupiah_(value) { return 'Rp' + Number(value || 0).toLocaleString('id-ID'); }
function requireFields_(obj, fields) { fields.forEach(key => { if (obj[key] === undefined || obj[key] === null || String(obj[key]).trim() === '') throw new Error('Kolom wajib: ' + key); }); }
function serializeCell_(value) { return value instanceof Date ? Utilities.formatDate(value, APP.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX") : value; }
function escapeHtml_(value) { return String(value || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }

function passwordCredential_(password) {
  validatePassword_(password);
  const salt = Utilities.getUuid().replace(/-/g, '');
  return { salt: salt, hash: hashText_(salt + String(password)) };
}

function verifyPassword_(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  return hashText_(String(salt) + String(password)) === String(expectedHash);
}

function hashText_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, '');
}

function validatePassword_(password) {
  password = String(password || '');
  if (password.length < 8) throw new Error('Password minimal 8 karakter.');
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('Password harus mengandung huruf dan angka.');
}

function temporaryPassword_() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Date.now());
  let result = 'Lk';
  for (let i = 0; i < 8; i++) result += alphabet.charAt(Math.abs(bytes[i]) % alphabet.length);
  return result + '7';
}
