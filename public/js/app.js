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
    dashboard: { id: 'view-dashboard', title: 'Academic Overview' },
    list: { id: 'view-list', title: 'Student Records' },
    add: { id: 'view-form', title: 'New Registration', btn: 'Register Student' },
    edit: { id: 'view-form', title: 'Edit Records', btn: 'Save Changes' }
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

    tableBody.innerHTML = filtered.length > 0 ? filtered.map(student => `
        <tr class="border-b border-[#141414]/5 hover:bg-[#FDFCFB] group transition-colors">
            <td class="p-4 font-mono text-sm">${student.student_id}</td>
            <td class="p-4 font-bold">${student.full_name}</td>
            <td class="p-4 text-sm text-[#141414]/70">${student.course}</td>
            <td class="p-4 text-center">
                <span class="bg-[#FDFCFB] border border-[#141414]/10 px-2.5 py-0.5 rounded-full text-xs font-bold">L${student.year_level}</span>
            </td>
            <td class="p-4 text-sm text-[#141414]/50">${student.email_address}</td>
            <td class="p-4 text-right flex items-center justify-end gap-2">
                <button onclick="editStudent(${student.id})" class="p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/5 rounded-lg">
                    <i class="lucide-edit-2 text-sm"></i>
                </button>
                <button onclick="deleteStudent(${student.id})" class="p-2 text-red-200 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <i class="lucide-trash-2 text-sm"></i>
                </button>
            </td>
        </tr>
    `).join('') : `
        <tr>
            <td colspan="6" class="p-20 text-center text-[#141414]/30">
                <p class="font-serif italic text-lg">No records found</p>
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
    toastEl.classList.remove('hidden', 'bg-green-50', 'bg-red-50', 'text-green-700', 'text-red-700', 'border-green-200', 'border-red-200');
    
    if (type === 'success') {
        toastEl.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
        document.getElementById('toast-icon').innerHTML = '<i class="lucide-check-circle-2 text-sm"></i>';
    } else {
        toastEl.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
        document.getElementById('toast-icon').innerHTML = '<i class="lucide-alert-circle text-sm"></i>';
    }

    document.getElementById('toast-message').textContent = message;
    
    // Animate in
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => {
        toastEl.style.opacity = '1';
        toastEl.style.transform = 'translate(-50%, 0)';
    }, 10);

    setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => toastEl.classList.add('hidden'), 300);
    }, 3000);
}
