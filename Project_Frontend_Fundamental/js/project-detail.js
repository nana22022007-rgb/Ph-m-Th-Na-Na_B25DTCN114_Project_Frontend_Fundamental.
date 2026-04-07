document.addEventListener('DOMContentLoaded', function () {
    // 1. LẤY DỮ LIỆU TỪ LOCALSTORAGE
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = Number(urlParams.get('projectId'));
    let projects = JSON.parse(localStorage.getItem("projects")) || [];
    let allTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let users = JSON.parse(localStorage.getItem("users")) || [];
    const currentProject = projects.find(p => p.id === projectId);
    // Kiểm tra nếu không có dự án -> Đá về trang chủ
    if (!currentProject) {
        alert("Không tìm thấy dự án!");
        window.location.href = 'project-manager.html';
        return;
    }
    // Hiển thị thông tin dự án lên Header
    document.querySelector('.project-title-desc h2').innerText = currentProject.projectName;
    document.querySelector('.project-title-desc p').innerText = currentProject.description || "Chưa có mô tả.";
    // CÁC BIẾN DOM & TRẠNG THÁI
    const taskModal = document.getElementById('taskModal');
    const deleteModal = document.getElementById('deleteModal');
    const memberModal = document.getElementById('modalMembers'); // Modal danh sách TV
    const addMemberModal = document.getElementById('addMemberModal'); // Modal thêm TV
    const addMemberForm = document.getElementById('addMemberForm'); // Thêm biến form
    const taskForm = document.getElementById('taskForm');
    let editingTaskId = null; // Đánh dấu id khi đang sửa
    let deletingTaskId = null; // Đánh dấu id khi chuẩn bị xóa
    // [Tối ưu] Tự động đổ danh sách Users vào thẻ Select người phụ trách thay vì fix cứng HTML
    const assigneeSelect = document.getElementById('assignee');
    assigneeSelect.innerHTML = '<option value="">Chọn người phụ trách</option>' +
        users.map(u => `<option value="${u.id}">${u.fullName}</option>`).join('');
    // 2. CÁC HÀM XỬ LÝ GIAO DIỆN & VALIDATE
    // Hiển thị lỗi dưới Input
    function showError(inputId, message) {
        const inputEl = document.getElementById(inputId);
        inputEl.classList.add('input-error');
        let errorSpan = inputEl.nextElementSibling;
        if (!errorSpan || !errorSpan.classList.contains('error-text')) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-text';
            errorSpan.style.color = '#ff4d4f';
            errorSpan.style.fontSize = '12px';
            errorSpan.style.marginTop = '4px';
            errorSpan.style.display = 'block';
            inputEl.parentNode.insertBefore(errorSpan, inputEl.nextSibling);
        }
        errorSpan.innerText = message;
        errorSpan.style.display = 'block';
    }
    // Thêm sự kiện input để xử lý UX xóa viền đỏ và thông báo lỗi
    taskForm.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', function () {
            this.classList.remove('input-error');
            const errorSpan = this.nextElementSibling;
            if (errorSpan && errorSpan.classList.contains('error-text')) {
                errorSpan.style.display = 'none';
            }
        });
    });
    // Xóa tất cả cảnh báo lỗi
    function clearErrors() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        document.querySelectorAll('.error-text').forEach(el => el.style.display = 'none');
    }
    // Mở Modal
    function openModal(modal) {
        modal.classList.add('active');
    }
    // Đóng Modal & Reset Form
    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        clearErrors();
        editingTaskId = null;
    }
    // Hiển thị thông báo (Bonus SweetAlert)
    function showSuccessMsg(msg) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'success', title: 'Thành công!', text: msg, timer: 1500, showConfirmButton: false });
        } else {
            alert(msg);
        }
    }
    // Validate dữ liệu form Task
    function validateTask() {
        clearErrors();
        let isValid = true;
        const name = document.getElementById('taskName').value.trim();
        const startDateStr = document.getElementById('startDate').value;
        const endDateStr = document.getElementById('endDate').value;
        // 1. Validate Tên nhiệm vụ
        if (!name) {
            showError('taskName', 'Tên nhiệm vụ không được để trống.');
            isValid = false;
        } else if (name.length < 5) {
            showError('taskName', 'Tên nhiệm vụ phải có tối thiểu 5 ký tự.');
            isValid = false;
        } else {
            // Kiểm tra trùng lặp trong cùng 1 project (bỏ qua chính nó khi đang Edit)
            const isDuplicate = allTasks.some(t =>
                t.projectId === projectId &&
                t.taskName.toLowerCase() === name.toLowerCase() &&
                t.id !== editingTaskId
            );
            if (isDuplicate) {
                showError('taskName', 'Tên nhiệm vụ này đã tồn tại trong dự án.');
                isValid = false;
            }
        }
        // 2. Validate Ngày tháng
        if (!startDateStr) {
            showError('startDate', 'Vui lòng chọn ngày bắt đầu.');
            isValid = false;
        }
        if (!endDateStr) {
            showError('endDate', 'Vui lòng chọn hạn chót.');
            isValid = false;
        }
        if (startDateStr && endDateStr) {
            const start = new Date(startDateStr);
            const end = new Date(endDateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Đưa về 0h để so sánh chính xác theo ngày
            // Ngày bắt đầu > ngày hiện tại (Chỉ kiểm tra khi Thêm mới)
            if (!editingTaskId && start <= today) {
                showError('startDate', 'Ngày bắt đầu phải lớn hơn ngày hiện tại.');
                isValid = false;
            }
            // Hạn chót > Ngày bắt đầu
            if (end <= start) {
                showError('endDate', 'Hạn chót phải sau ngày bắt đầu.');
                isValid = false;
            }
        }
        // Bắt lỗi rỗng cho các Select boxes
        if (!document.getElementById('assignee').value) { showError('assignee', 'Bắt buộc chọn.'); isValid = false; }
        if (!document.getElementById('status').value) { showError('status', 'Bắt buộc chọn.'); isValid = false; }
        if (!document.getElementById('priority').value) { showError('priority', 'Bắt buộc chọn.'); isValid = false; }
        if (!document.getElementById('progress').value) { showError('progress', 'Bắt buộc chọn.'); isValid = false; }
        return isValid;
    }
    // 3. RENDER T RA DANH SÁCH NHIỆM VỤ
    function renderTasks() {
        const tbody = document.querySelector('.task-grid-table tbody');
        const projectTasks = allTasks.filter(t => t.projectId === projectId);
        // Hàm format ngày từ YYYY-MM-DD sang MM - DD
        const formatShortDate = (dateStr) => {
            if (!dateStr) return "";
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[1]} - ${parts[2]}`;
            }
            return dateStr;
        };
        const createTaskRow = (t) => {
            const user = users.find(u => u.id === Number(t.assigneeId));
            const userName = user ? user.fullName : "Chưa rõ";
            let progressClass = "";
            if (t.progress === "Đúng tiến độ") progressClass = "ontrack";
            else if (t.progress === "Có rủi ro") progressClass = "atrisk";
            else if (t.progress === "Trễ hạn") progressClass = "late";
            let priorityClass = t.priority === "Thấp" ? "low" : (t.priority === "Trung bình" ? "medium" : "high");
            const statusClass = t.status.replace(/\s+/g, '-');
            return `
                <tr class="group-${statusClass}" data-id="${t.id}">
                <td class="text-left">${t.taskName}</td>
                <td>${userName}</td>
                <td><span class="badge badge-priority-${priorityClass}">${t.priority}</span></td>
                <td class="date">${formatShortDate(t.asignDate)}</td>
                <td class="date">${formatShortDate(t.dueDate)}</td>
                <td><span class="badge badge-progress-${progressClass}">${t.progress}</span></td>
                <td class="cell-actions">
                <button class="btn-icon-action btn-edit">Sửa</button>
                <button class="btn-icon-action btn-delete">Xóa</button>
                 </td>
                </tr>`;
        };
        const statuses = ['To do', 'In progress', 'Pending', 'Done'];
        tbody.innerHTML = statuses.map(status => {
            const tasksInGroup = projectTasks.filter(t => t.status === status);
            const statusClass = status.replace(/\s+/g, '-'); // Tạo class không có dấu cách
            return `
<tr class="group-header-row" data-target="${statusClass}">
<td colspan="7">▼ ${status} (${tasksInGroup.length})</td>
</tr>
${tasksInGroup.map(createTaskRow).join('')}
`;
        }).join('');
    }
    // 4. LẮNG NGHE SỰ KIỆN (EVENT DELEGATION)
    document.addEventListener('click', (e) => {
        const target = e.target;
        // XỬ LÝ ĐÓNG/MỞ DANH SÁCH
        const headerRow = target.closest('.group-header-row');
        if (headerRow) {
            const targetGroup = headerRow.dataset.target; // Lấy tên group (ví dụ: To-do)
            const taskRows = document.querySelectorAll(`.group-${targetGroup}`);
            const isCollapsed = headerRow.classList.toggle('collapsed');
            // Đổi icon mũi tên và ẩn/hiện các dòng
            const cell = headerRow.querySelector('td');
            const currentText = cell.innerText;
            if (isCollapsed) {
                cell.innerText = currentText.replace('▼', '▶');
                taskRows.forEach(row => row.classList.add('row-hidden'));
            } else {
                cell.innerText = currentText.replace('▶', '▼');
                taskRows.forEach(row => row.classList.remove('row-hidden'));
            }
            return; // Thoát hàm để không chạy các logic bên dưới
        }
        // Bấm Thêm nhiệm vụ
        if (target.classList.contains('btn-add-task')) {
            taskForm.reset();
            clearErrors();
            editingTaskId = null;
            document.querySelector('#taskModal h3').innerText = "Thêm nhiệm vụ mới";
            openModal(taskModal);
        }
        // Bấm Sửa nhiệm vụ
        if (target.classList.contains('btn-edit')) {
            const row = target.closest('tr');
            editingTaskId = Number(row.dataset.id);
            const task = allTasks.find(t => t.id === editingTaskId);
            if (task) {
                // Đổ dữ liệu vào Form
                document.getElementById('taskName').value = task.taskName;
                document.getElementById('assignee').value = task.assigneeId; // Dùng ID
                document.getElementById('status').value =
                    task.status === 'To do' ? 'todo' :
                        (task.status === 'In progress' ? 'inprogress' :
                            (task.status === 'Pending' ? 'pending' : 'done'));
                document.getElementById('startDate').value = task.asignDate;
                document.getElementById('endDate').value = task.dueDate;
                document.getElementById('priority').value = task.priority === 'Thấp' ? 'low' : (task.priority === 'Trung bình' ? 'medium' : 'high');
                document.getElementById('progress').value =
                    task.progress === 'Đúng tiến độ' ? 'ontrack' :
                        (task.progress === 'Có rủi ro' ? 'atrisk' : 'late');
                document.querySelector('#taskModal h3').innerText = "Chỉnh sửa nhiệm vụ";
                openModal(taskModal);
            }
        }
        // Bấm Xóa nhiệm vụ
        if (target.classList.contains('btn-delete')) {
            deletingTaskId = Number(target.closest('tr').dataset.id);
            openModal(deleteModal);
        }
        // Click Đóng Modal (Dấu X, Nút Hủy, Click ra ngoài màng mờ)
        if (target.classList.contains('close-modal') || target.classList.contains('btn-cancel') || target.classList.contains('modal-overlay')) {
            // Ngăn chặn nếu vô tình click vào trong form (thuộc phần modal-overlay)
            if (target.closest('.modal-card') && target.classList.contains('modal-overlay')) return;
            closeModal();
        }
        // 1. Bấm vào nút "..." (more-dots) để mở danh sách thành viên
        if (target.classList.contains('more-dots') || target.closest('.more-dots')) {
            // (Tuỳ chọn) Nếu bạn muốn tự động load danh sách thành viên vào HTML
            // thì gọi hàm render ở đây trước khi open
            openModal(modalMembers);
        }
        // 2. Bấm vào nút "+ Thêm thành viên" để mở popup thêm
        if (target.classList.contains('btn-add-member') || target.closest('.btn-add-member')) {
            addMemberForm.reset(); // Xóa dữ liệu cũ
            clearErrors();
            openModal(addMemberModal);
        }
    });
    // 5. XỬ LÝ SUBMIT LƯU DỮ LIỆU
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // 1. Chạy hàm Validate, Nếu False thì dừng luôn
        if (!validateTask()) return;
        const rawPriority = document.getElementById('priority').value;
        const priorityVN = rawPriority === 'low' ? 'Thấp' : (rawPriority === 'medium' ? 'Trung bình' : 'Cao');
        const rawProgress = document.getElementById('progress').value;
        const progressVN = rawProgress === 'ontrack' ? 'Đúng tiến độ' : (rawProgress === 'atrisk' ? 'Có rủi ro' : 'Trễ hạn');
        const rawStatus = document.getElementById('status').value;
        const statusText =
            rawStatus === 'todo' ? 'To do' :
                (rawStatus === 'inprogress' ? 'In progress' :
                    (rawStatus === 'pending' ? 'Pending' : 'Done'));
        // 3. Gom dữ liệu lại
        const taskData = {
            id: editingTaskId || Date.now(), // Thêm thì tạo id mới
            taskName: document.getElementById('taskName').value.trim(),
            assigneeId: Number(document.getElementById('assignee').value), // Lưu ID để Map cho đúng
            projectId: projectId,
            asignDate: document.getElementById('startDate').value,
            dueDate: document.getElementById('endDate').value,
            priority: priorityVN,
            progress: progressVN,
            status: statusText
        };
        // 4. Lưu lại
        if (editingTaskId) {
            const index = allTasks.findIndex(t => t.id === editingTaskId);
            if (index !== -1) allTasks[index] = taskData;
            showSuccessMsg("Cập nhật nhiệm vụ thành công!");
        } else {
            allTasks.push(taskData);
            showSuccessMsg("Thêm nhiệm vụ mới thành công!");
        }
        localStorage.setItem("tasks", JSON.stringify(allTasks));
        renderTasks();
        closeModal();
    });
    // 6. XÁC NHẬN XÓA
    document.getElementById('btnConfirmDelete').addEventListener('click', () => {
        allTasks = allTasks.filter(t => t.id !== deletingTaskId);
        localStorage.setItem("tasks", JSON.stringify(allTasks));
        showSuccessMsg("Đã xóa nhiệm vụ!");
        renderTasks();
        closeModal();
    });
    renderTasks();
    // XỬ LÝ SUBMIT THÊM THÀNH VIÊN
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Chặn load lại trang
            const emailInput = document.getElementById('memberEmail');
            const roleInput = document.getElementById('memberRole');
            const emailError = document.getElementById('emailError');
            const emailValue = emailInput.value.trim();
            const roleValue = roleInput.value.trim();
            // Validate cơ bản
            if (!emailValue || !roleValue) {
                showError('memberEmail', 'Vui lòng nhập đầy đủ thông tin');
                return;
            }
            emailError.style.display = 'none';
            emailInput.classList.remove('input-error');
            showSuccessMsg("Đã thêm thành viên mới thành công!");
            closeModal();
            addMemberForm.reset();
        });
    }
    // Thay thế đoạn xử lý đăng xuất cũ bằng đoạn này:
    // Tìm tất cả các nút có ý định đăng xuất (cả trên header và nút ẩn bên dưới)
    const logoutTriggers = document.querySelectorAll('.btn-logout, .btn-open-logout');
    const logoutModal = document.getElementById('logoutModal');
    const btnConfirmLogout = document.getElementById('btnConfirmLogout');
    if (logoutTriggers.length > 0) {
        logoutTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Ngăn chuyển trang ngay lập tức
                e.stopPropagation(); // Ngăn sự kiện nổi bọt lên document delegation
                if (logoutModal) {
                    openModal(logoutModal);
                } else {
                    console.error("Không tìm thấy logoutModal trong DOM");
                }
            });
        });
    }
    if (btnConfirmLogout) {
        btnConfirmLogout.addEventListener('click', () => {
            // Xóa dữ liệu đăng nhập
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            // Chuyển hướng
            window.location.href = 'login.html';
        });
    }
}); 