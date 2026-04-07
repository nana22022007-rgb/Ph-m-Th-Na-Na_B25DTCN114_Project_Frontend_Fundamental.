document.addEventListener('DOMContentLoaded', function () {
    // 1. AUTH & DATA
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    let projects = JSON.parse(localStorage.getItem("projects")) || [];

    const modal = document.getElementById('projectModal');
    const modalTitle = modal.querySelector('h4');
    const inputName = document.getElementById('projectName');
    const inputDesc = document.getElementById('projectDesc');
    const tableBody = document.getElementById('projectTableBody');
    const deleteModal = document.getElementById('deleteModal');
    const logoutModal = document.getElementById('logoutModal');
    const btnConfirmDelete = document.querySelector('.btn-delete-confirm');

    let editingProjectId = null;
    let deletingId = null;
    let currentPage = 1;
    const rowsPerPage = 6;

    // 3. LOGIC FUNCTIONS
    const clearErrorOnInput = (inputElement, errorElementId) => {
        if (!inputElement) return;
        inputElement.addEventListener('input', function () {
            const errorEl = document.getElementById(errorElementId);
            if (errorEl) {
                errorEl.style.display = 'none';
                this.style.borderColor = "#dee2e6";
            }
        });
    };

    function renderProjects(listToDisplay = null) {
        tableBody.innerHTML = "";
        const displayList = listToDisplay || projects.filter(p =>
            p.members && p.members.some(m => m.userId === currentUser.id && m.role === "Project owner")
        );

        const startIndex = (currentPage - 1) * rowsPerPage;
        const paginatedItems = displayList.slice(startIndex, startIndex + rowsPerPage);

        if (paginatedItems.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">Không tìm thấy dự án nào!</td></tr>`;
        } else {
            paginatedItems.forEach((p, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td class="text-left">${p.projectName}</td>
                <td>
                    <button class="btn-edit" data-id="${p.id}">Sửa</button>
                    <button class="btn-delete" data-id="${p.id}">Xóa</button>
                    <button class="btn-detail" onclick="window.location.href='./project-detail.html?projectId=${p.id}'">Chi tiết</button>
                </td>`;
                tableBody.appendChild(tr);
            });
        }
        renderPagination(displayList.length);
    }

    function getPaginationRange(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
        if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    function renderPagination(totalItems) {
        const paginationContainer = document.querySelector('.pagination');
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(totalItems / rowsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';

        const prevBtn = document.createElement('button');
        prevBtn.className = `p-btn ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = "&lt;";
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderProjects(); } };
        paginationContainer.appendChild(prevBtn);

        getPaginationRange(currentPage, totalPages).forEach(page => {
            if (page === '...') {
                const dots = document.createElement('span');
                dots.innerText = '...';
                dots.style.padding = '0 10px';
                paginationContainer.appendChild(dots);
            } else {
                const pageBtn = document.createElement('button');
                pageBtn.className = `p-btn ${page === currentPage ? 'active' : ''}`;
                pageBtn.innerText = page;
                pageBtn.onclick = () => { currentPage = page; renderProjects(); };
                paginationContainer.appendChild(pageBtn);
            }
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = `p-btn ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = "&gt;";
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderProjects(); } };
        paginationContainer.appendChild(nextBtn);
    }

    const resetModal = () => {
        inputName.value = "";
        inputDesc.value = "";
        document.getElementById('nameError').style.display = 'none';
        document.getElementById('descError').style.display = 'none';
        inputName.style.borderColor = "#dee2e6";
        inputDesc.style.borderColor = "#dee2e6";
        editingProjectId = null;
    };

    function validateProjectData(name, desc, editId) {
        const trimmedName = name.trim();
        const trimmedDesc = desc.trim();
        if (trimmedName === "") return { field: "name", message: "Tên dự án không được để trống!" };
        if (trimmedName.length < 5 || trimmedName.length > 50) return { field: "name", message: "Tên dự án phải từ 5 đến 50 ký tự!" };
        if (trimmedDesc === "") return { field: "desc", message: "Mô tả dự án không được để trống!" };
        if (trimmedDesc.length < 10 || trimmedDesc.length > 200) return { field: "desc", message: "Mô tả phải từ 10 đến 200 ký tự!" };

        const isDuplicate = projects.some(p => p.projectName.trim().toLowerCase() === trimmedName.toLowerCase() && p.id !== editId);
        if (isDuplicate) return { field: "name", message: "Tên dự án này đã tồn tại rồi" };
        return null;
    }

    // 4. EVENTS
    document.querySelector('.section-1 input').addEventListener('input', function (e) {
        currentPage = 1;
        const searchTerm = e.target.value.toLowerCase();
        const filtered = projects.filter(p =>
            p.projectName.toLowerCase().includes(searchTerm) &&
            p.members.some(m => m.userId === currentUser.id && m.role === "Project owner")
        );
        renderProjects(filtered);
    });

    document.querySelector('.btn-add').onclick = () => {
        resetModal();
        modalTitle.innerText = "Thêm dự án mới";
        modal.classList.add('modal-open');
    };

    document.querySelector(".btn-save").onclick = () => {
        const name = inputName.value;
        const desc = inputDesc.value;
        const nameErrorEl = document.getElementById('nameError');
        const descErrorEl = document.getElementById('descError');

        const error = validateProjectData(name, desc, editingProjectId);
        if (error) {
            if (error.field === "name") {
                nameErrorEl.innerText = error.message;
                nameErrorEl.style.display = "block";
                nameErrorEl.style.color = "red";
                inputName.style.borderColor = "red";
                inputName.focus();
            } else {
                descErrorEl.innerText = error.message;
                descErrorEl.style.display = "block";
                descErrorEl.style.color = "red";
                inputDesc.style.borderColor = "red";
                inputDesc.focus();
            }
            return;
        }
        let successMessage = "";
        if (editingProjectId) {
            const index = projects.findIndex(p => p.id === editingProjectId);
            if (index !== -1) {
                projects[index].projectName = name.trim();
                projects[index].description = desc.trim();
                successMessage = "Cập nhật dự án thành công!";
            }
        } else {
            const maxId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) : 0;
            projects.push({
                id: maxId + 1,
                projectName: name.trim(),
                description: desc.trim(),
                members: [{ userId: currentUser.id, role: "Project owner" }]
            });
            successMessage = "Thêm dự án mới thành công!";
        }

        localStorage.setItem("projects", JSON.stringify(projects));
        modal.classList.remove("modal-open");
        renderProjects();
        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: successMessage,
            timer: 1500,
            showConfirmButton: false
        });
    };
    // Sửa và xóa
    tableBody.addEventListener('click', (e) => {
        const id = Number(e.target.dataset.id);
        // nútsửa
        if (e.target.classList.contains('btn-edit')) {
            editingProjectId = id;
            const p = projects.find(item => item.id === id);
            inputName.value = p.projectName;
            inputDesc.value = p.description;
            modalTitle.innerText = "Chỉnh sửa dự án";
            modal.classList.add("modal-open");
        }
        //nút xóa
        if (e.target.classList.contains('btn-delete')) {
            deletingId = id;
            deleteModal.classList.add("modal-open");
        }
    });

    btnConfirmDelete.onclick = () => {
        projects = projects.filter(p => p.id !== deletingId);
        localStorage.setItem("projects", JSON.stringify(projects));
        deleteModal.classList.remove("modal-open");
        renderProjects();
        Swal.fire({
            icon: 'success',
            title: 'Đã xoá!',
            text: 'Dự án đã được xoá thành công.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // Đóng tất cả các loại modal
    document.querySelectorAll('.btn-cancel, .close-modal, #btnCancelLogout, #btnCancelDelete').forEach(btn => {
        btn.onclick = () => {
            modal.classList.remove('modal-open');
            deleteModal.classList.remove('modal-open');
            if (logoutModal) logoutModal.classList.remove('modal-open');
        };
    });

    window.onclick = function (event) {
        if (event.target === modal) modal.classList.remove('modal-open');
        if (event.target === deleteModal) deleteModal.classList.remove('modal-open');
        if (event.target === logoutModal) logoutModal.classList.remove('modal-open');
    };

    // XỬ LÝ ĐĂNG XUẤT (FIXED)
    const logoutTriggers = document.querySelectorAll('.btn-trigger-logout');
    if (logoutTriggers.length > 0) {
        logoutTriggers.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (logoutModal) logoutModal.classList.add('modal-open');
            });
        });
    }

    const btnConfirmLogout = document.getElementById('btnConfirmLogout');
    if (btnConfirmLogout) {
        btnConfirmLogout.addEventListener('click', function () {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // Kích hoạt xóa lỗi khi gõ
    clearErrorOnInput(inputName, 'nameError');
    clearErrorOnInput(inputDesc, 'descError');

    renderProjects();
});