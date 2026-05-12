// State Management
let students = [];
let currentView = 'dashboard';

// Constants
const API_URL = '/api/students';

// Selectors
const tableBody = document.getElementById('student-table-body');
const studentForm = document.getElementById('student-form');
const searchInput = document.getElementById('search-input');
const toastEl = document.getElementById('toast');

// Views mapping
const views = {
    dashboard: { id: 'view-dashboard', title: 'Institutional Dashboard' },
    list: { id: 'view-list', title: 'Student Records Registry' },
    add: { id: 'view-form', title: 'New Student Enrollment', btn: 'Register Student' },
    edit: { id: 'view-form', title: 'Edit Student Information', btn: 'Update Record' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchStudents();
    showView('dashboard');
    
    // Search Listener
    searchInput.addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    // Form Listener
    studentForm.addEventListener('submit', handleFormSubmit);
});

async function fetchStudents() {
    try {
        const res = await fetch(API_URL);
        students = await res.json();
        updateStats();
        if (currentView === 'list') renderTable();
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Failed to load students', 'error');
    }
}

function updateStats() {
    document.getElementById('stat-total').textContent = students.length;
    const courses = new Set(students.map(s => s.course));
    document.getElementById('stat-courses').textContent = courses.size;
}

function showView(view) {
    currentView = view;
    
    // Toggle View Content
    document.querySelectorAll('.view-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(views[view].id).classList.remove('hidden');
    
    // Update Title
    document.getElementById('view-title').textContent = views[view].title;
    
    // Toggle Nav State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active-nav'));
    const navItem = document.getElementById(`nav-${view === 'edit' ? 'list' : view}`);
    if (navItem) navItem.classList.add('active-nav');

    // Update Form Button if needed
    if (view === 'add' || view === 'edit') {
        document.getElementById('submit-btn').textContent = views[view].btn;
        if (view === 'add') {
            studentForm.reset();
            document.getElementById('edit-id').value = '';
        }
    }

    if (view === 'list') renderTable();
}

function renderTable(filter = '') {
    const filtered = students.filter(s => 
        s.full_name.toLowerCase().includes(filter.toLowerCase()) ||
        s.student_id.toLowerCase().includes(filter.toLowerCase()) ||
        s.course.toLowerCase().includes(filter.toLowerCase())
    );

    document.getElementById('result-count').textContent = filtered.length;

    tableBody.innerHTML = filtered.length > 0 ? filtered.map(student => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <span class="text-sm font-semibold text-gray-900">${student.student_id}</span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900">${student.full_name}</div>
                <div class="text-xs text-gray-500">${student.course}</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                    L${student.year_level}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 font-medium">${student.email_address}</td>
            <td class="px-6 py-4 text-right space-x-1">
                <button onclick="editStudent(${student.id})" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                    <i class="lucide-edit-2 size-4"></i>
                </button>
                <button onclick="deleteStudent(${student.id})" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                    <i class="lucide-trash-2 size-4"></i>
                </button>
            </td>
        </tr>
    `).join('') : `
        <tr>
            <td colspan="5" class="py-20 text-center text-gray-400">
                <i class="lucide-search size-10 mx-auto mb-3 opacity-20"></i>
                <p class="text-sm">No students found matching your search</p>
            </td>
        </tr>
    `;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id').value;
    const data = {
        student_id: document.getElementById('field-student-id').value,
        full_name: document.getElementById('field-full-name').value,
        course: document.getElementById('field-course').value,
        year_level: parseInt(document.getElementById('field-year-level').value),
        email_address: document.getElementById('field-email').value
    };

    try {
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API_URL}/${editId}` : API_URL;
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(editId ? 'Record updated!' : 'Student registered!', 'success');
            fetchStudents();
            setTimeout(() => showView('list'), 1000);
        } else {
            const err = await res.json();
            showToast(err.error || 'Operation failed', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    document.getElementById('edit-id').value = student.id;
    document.getElementById('field-student-id').value = student.student_id;
    document.getElementById('field-full-name').value = student.full_name;
    document.getElementById('field-course').value = student.course;
    document.getElementById('field-year-level').value = student.year_level;
    document.getElementById('field-email').value = student.email_address;
    
    showView('edit');
}

async function deleteStudent(id) {
    if (!confirm('Permanently delete this student record?')) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Record deleted', 'success');
            fetchStudents();
        } else {
            showToast('Delete failed', 'error');
        }
    } catch (err) {
        showToast('Connection error', 'error');
    }
}

function showToast(message, type) {
    toastEl.classList.remove('hidden', 'bg-white', 'bg-red-50', 'text-gray-900', 'text-red-700', 'border-gray-200', 'border-red-200');
    
    if (type === 'success') {
        toastEl.classList.add('bg-white', 'text-gray-900', 'border-gray-200');
        document.getElementById('toast-icon').innerHTML = '<i class="lucide-check-circle-2 text-green-500 size-5"></i>';
    } else {
        toastEl.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
        document.getElementById('toast-icon').innerHTML = '<i class="lucide-alert-circle text-red-500 size-5"></i>';
    }

    document.getElementById('toast-message').textContent = message;
    
    // Animate in
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => {
        toastEl.style.opacity = '1';
        toastEl.style.transform = 'translate(-50%, 0)';
    }, 10);

    setTimeout(() => {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translate(-50%, -10px)';
        setTimeout(() => toastEl.classList.add('hidden'), 300);
    }, 3000);
}
