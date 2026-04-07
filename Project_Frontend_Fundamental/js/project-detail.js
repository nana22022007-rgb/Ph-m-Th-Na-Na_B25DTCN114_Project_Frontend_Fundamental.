document.addEventListener("DOMContentLoaded", function () {
  // 1. LẤY DỮ LIỆU TỪ LOCALSTORAGE
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = Number(urlParams.get("projectId"));
  let projects = JSON.parse(localStorage.getItem("projects")) || [];
  let allTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Tìm dự án hiện tại
  let currentProjectIndex = projects.findIndex((p) => p.id === projectId);
  if (currentProjectIndex === -1) {
    window.location.href = "project-manager.html";
    return;
  }
  let currentProject = projects[currentProjectIndex];

  // Hiển thị thông tin dự án lên Header
  document.querySelector(".project-title-desc h2").innerText =
    currentProject.projectName;
  document.querySelector(".project-title-desc p").innerText =
    currentProject.description || "Chưa có mô tả.";

  // CÁC BIẾN DOM & TRẠNG THÁI
  const taskModal = document.getElementById("taskModal");
  const deleteModal = document.getElementById("deleteModal");
  const memberModal = document.getElementById("modalMembers");
  const addMemberModal = document.getElementById("addMemberModal");
  const addMemberForm = document.getElementById("addMemberForm");
  const taskForm = document.getElementById("taskForm");

  let editingTaskId = null;
  let deletingTaskId = null;

  // --- KHỞI TẠO DỮ LIỆU ĐẦU VÀO ---

  // Tự động đổ dropdown Sort
  const sortSelect = document.querySelector(".select-filter");
  sortSelect.innerHTML = `
        <option value="">Sắp xếp theo</option>
        <option value="dueDateAsc">Hạn chót (Gần nhất)</option>
        <option value="dueDateDesc">Hạn chót (Xa nhất)</option>
        <option value="priorityDesc">Độ ưu tiên (Cao -> Thấp)</option>
        <option value="priorityAsc">Độ ưu tiên (Thấp -> Cao)</option>
    `;

  // Hàm cập nhật dropdown Assignee (chỉ lấy những user có trong project)
  function updateAssigneeDropdown() {
    const assigneeSelect = document.getElementById("assignee");
    const projectMembers = currentProject.members
      .map((m) => {
        const u = users.find((user) => user.id === m.userId);
        return u
          ? `<option value="${u.id}">${u.fullName || u.fullname}</option>`
          : "";
      })
      .join("");
    assigneeSelect.innerHTML =
      '<option value="">Chọn người phụ trách</option>' + projectMembers;
  }

  // 2. CÁC HÀM TIỆN ÍCH & VALIDATE
  function showError(inputId, message) {
    const inputEl = document.getElementById(inputId);
    inputEl.classList.add("input-error");
    let errorSpan = inputEl.nextElementSibling;
    if (!errorSpan || !errorSpan.classList.contains("error-text")) {
      errorSpan = document.createElement("span");
      errorSpan.className = "error-text";
      errorSpan.style.display = "block";
      inputEl.parentNode.insertBefore(errorSpan, inputEl.nextSibling);
    }
    errorSpan.innerText = message;
    errorSpan.style.display = "block";
  }

  function clearErrors() {
    document
      .querySelectorAll(".input-error")
      .forEach((el) => el.classList.remove("input-error"));
    document
      .querySelectorAll(".error-text")
      .forEach((el) => (el.style.display = "none"));
  }

  function openModal(modal) {
    modal.classList.add("active");
  }
  function closeModal() {
    document
      .querySelectorAll(".modal-overlay")
      .forEach((m) => m.classList.remove("active"));
    clearErrors();
    editingTaskId = null;
  }

  function showSuccessMsg(msg) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: msg,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      alert(msg);
    }
  }

  // 3. TÍNH NĂNG QUẢN LÝ THÀNH VIÊN (MỚI)
  const colors = ["bg-blue", "bg-purple", "bg-orange", "bg-gray"];

  function renderMembers() {
    const membersListTop = document.querySelector(".members-list");
    const membersEditList = document.querySelector(".members-edit-list");

    let topHTML = "";
    let editHTML = "";

    currentProject.members.forEach((member, index) => {
      const user = users.find((u) => u.id === member.userId);
      if (!user) return;

      const name = user.fullName || user.fullname;
      const initials = name.substring(0, 2).toUpperCase();
      const colorClass = colors[index % colors.length];

      // Render thành viên
      if (index < 2) {
        topHTML += `
                <div class="member-item">
                    <div class="avatar ${colorClass}">${initials}</div>
                    <div class="member-info-text">
                        <strong>${name}</strong>
                        <span>${member.role}</span>
                    </div>
                </div>`;
      }

      // Render trong Modal danh sách
      const isOwner = member.role === "Project owner";
      editHTML += `
            <div class="member-edit-item" data-userid="${user.id}">
                <div class="member-info-group">
                    <div class="avatar ${colorClass}">${initials}</div>
                    <div class="member-text">
                        <p>${name}</p>
                        <span>${user.email}</span>
                    </div>
                </div>
                <div class="member-role-select">
                    <input type="text" class="input-role" value="${member.role}" ${isOwner ? 'disabled title="Không thể đổi vai trò chủ dự án"' : ""}>
                </div>
                <button class="icon-delete btn-delete-member" ${isOwner ? 'disabled style="opacity: 0.2; cursor: not-allowed;"' : ""}>
                    <img src="../assets/images/Trash.png" alt="Xóa">
                </button>
            </div>`;
    });

    topHTML += `<div class="avatar bg-gray more-dots" title="Quản lý tất cả thành viên">...</div>`;

    membersListTop.innerHTML = topHTML;
    membersEditList.innerHTML = editHTML;
    updateAssigneeDropdown(); // Cập nhật lại dropdown task
  }

  // A. THÊM THÀNH VIÊN MỚI
  if (addMemberForm) {
    addMemberForm.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", function () {
        this.classList.remove("input-error");
        const err = this.nextElementSibling;
        if (err && err.classList.contains("error-text"))
          err.style.display = "none";
      });
    });

    addMemberForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors();
      let isValid = true;

      const emailInput = document.getElementById("memberEmail");
      const roleInput = document.getElementById("memberRole");
      const emailValue = emailInput.value.trim();
      const roleValue = roleInput.value.trim();

      // 1. Check rỗng & độ dài
      if (!emailValue) {
        showError("memberEmail", "Email không được để trống.");
        isValid = false;
      }
      if (!roleValue) {
        showError("memberRole", "Vai trò không được để trống.");
        isValid = false;
      } else if (roleValue.length < 3) {
        showError("memberRole", "Vai trò phải có ít nhất 3 ký tự.");
        isValid = false;
      }

      // 2. Định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailValue && !emailRegex.test(emailValue)) {
        showError("memberEmail", "Email không đúng định dạng.");
        isValid = false;
      }

      if (!isValid) return;

      // 3. Kiểm tra user có tồn tại trong hệ thống (localStorage users) không
      const targetUser = users.find(
        (u) => u.email.toLowerCase() === emailValue.toLowerCase(),
      );
      if (!targetUser) {
        showError(
          "memberEmail",
          "Email này chưa đăng ký tài khoản trên hệ thống.",
        );
        return;
      }

      // 4. Kiểm tra user đã có trong dự án chưa
      const isExistInProject = currentProject.members.some(
        (m) => m.userId === targetUser.id,
      );
      if (isExistInProject) {
        showError("memberEmail", "Thành viên này đã có trong dự án.");
        return;
      }

      // LƯU THÀNH VIÊN
      currentProject.members.push({ userId: targetUser.id, role: roleValue });
      projects[currentProjectIndex] = currentProject;
      localStorage.setItem("projects", JSON.stringify(projects));

      showSuccessMsg("Đã thêm thành viên mới!");
      renderMembers();
      closeModal();
      addMemberForm.reset();
    });
  }

  // B. SỬA VÀ TRỰC TIẾP XÓA THÀNH VIÊN TRONG MODAL LIST
  document
    .querySelector(".members-edit-list")
    .addEventListener("change", (e) => {
      // Cập nhật vai trò khi gõ xong (on blur/change)
      if (e.target.classList.contains("input-role")) {
        const newRole = e.target.value.trim();
        if (newRole.length < 3) {
          alert("Vai trò phải lớn hơn 3 ký tự!");
          renderMembers(); // Reset lại nếu lỗi
          return;
        }
        const userId = Number(
          e.target.closest(".member-edit-item").dataset.userid,
        );
        const memberIndex = currentProject.members.findIndex(
          (m) => m.userId === userId,
        );

        if (memberIndex !== -1) {
          currentProject.members[memberIndex].role = newRole;
          projects[currentProjectIndex] = currentProject;
          localStorage.setItem("projects", JSON.stringify(projects));
          renderMembers(); // Render lại phần hiển thị Top
        }
      }
    });

  document
    .querySelector(".members-edit-list")
    .addEventListener("click", (e) => {
      // Xóa thành viên
      const deleteBtn = e.target.closest(".btn-delete-member");
      if (deleteBtn) {
        const userId = Number(
          deleteBtn.closest(".member-edit-item").dataset.userid,
        );

        // Xóa member khỏi project
        currentProject.members = currentProject.members.filter(
          (m) => m.userId !== userId,
        );
        projects[currentProjectIndex] = currentProject;
        localStorage.setItem("projects", JSON.stringify(projects));

        showSuccessMsg("Đã xóa thành viên khỏi dự án.");
        renderMembers();
      }
    });

  // 4. TÍNH NĂNG TÌM KIẾM, SẮP XẾP & RENDER TASK

  const searchInputTask = document.querySelector(
    '.filters-search-group input[type="text"]',
  );

  // Gắn sự kiện Search & Sort
  searchInputTask.addEventListener("input", renderTasks);
  sortSelect.addEventListener("change", renderTasks);

  function renderTasks() {
    const tbody = document.querySelector(".task-grid-table tbody");
    let projectTasks = allTasks.filter((t) => t.projectId === projectId);

    // A. TÌM KIẾM
    const searchTerm = searchInputTask.value.trim().toLowerCase();
    if (searchTerm) {
      projectTasks = projectTasks.filter((t) =>
        t.taskName.toLowerCase().includes(searchTerm),
      );
    }

    // B. SẮP XẾP
    const sortValue = sortSelect.value;
    const priorityScore = { Thấp: 1, "Trung bình": 2, Cao: 3 };

    if (sortValue) {
      projectTasks.sort((a, b) => {
        if (sortValue === "dueDateAsc")
          return new Date(a.dueDate) - new Date(b.dueDate);
        if (sortValue === "dueDateDesc")
          return new Date(b.dueDate) - new Date(a.dueDate);
        if (sortValue === "priorityDesc")
          return priorityScore[b.priority] - priorityScore[a.priority];
        if (sortValue === "priorityAsc")
          return priorityScore[a.priority] - priorityScore[b.priority];
        return 0;
      });
    }

    // Render ra HTML
    const formatShortDate = (dateStr) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      return parts.length === 3 ? `${parts[1]} - ${parts[2]}` : dateStr;
    };

    const createTaskRow = (t) => {
      const user = users.find((u) => u.id === Number(t.assigneeId));
      const userName = user ? user.fullName || user.fullname : "Chưa rõ";

      let progressClass =
        t.progress === "Đúng tiến độ"
          ? "ontrack"
          : t.progress === "Có rủi ro"
            ? "atrisk"
            : "late";
      let priorityClass =
        t.priority === "Thấp"
          ? "low"
          : t.priority === "Trung bình"
            ? "medium"
            : "high";
      const statusClass = t.status.replace(/\s+/g, "-");

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

    const statuses = ["To do", "In progress", "Pending", "Done"];

    // Tạo nội dung HTML cho bảng
    const tableHTML = statuses
      .map((status) => {
        const tasksInGroup = projectTasks.filter((t) => t.status === status);

        const statusClass = status.replace(/\s+/g, "-");
        return `
            <tr class="group-header-row" data-target="${statusClass}">
                <td colspan="7">▼ ${status} (${tasksInGroup.length})</td>
            </tr>
            ${tasksInGroup.map(createTaskRow).join("")}
        `;
      })
      .join("");

    // Hiển thị kết quả hoặc thông báo trống
    if (projectTasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center;">Không tìm thấy nhiệm vụ nào.</td></tr>`;
    } else {
      tbody.innerHTML = tableHTML;
    }
  }

  // 5. CÁC EVENT LẮNG NGHE (DELEGATION) VÀ TASK CRUD

  document.addEventListener("click", (e) => {
    const target = e.target;

    // Đóng/Mở Accordion Task
    const headerRow = target.closest(".group-header-row");
    if (headerRow) {
      const targetGroup = headerRow.dataset.target;
      const taskRows = document.querySelectorAll(`.group-${targetGroup}`);
      const isCollapsed = headerRow.classList.toggle("collapsed");
      const cell = headerRow.querySelector("td");

      if (isCollapsed) {
        cell.innerText = cell.innerText.replace("▼", "▶");
        taskRows.forEach((row) => row.classList.add("row-hidden"));
      } else {
        cell.innerText = cell.innerText.replace("▶", "▼");
        taskRows.forEach((row) => row.classList.remove("row-hidden"));
      }
      return;
    }

    // Mở Modal Thành Viên
    if (
      target.classList.contains("more-dots") ||
      target.closest(".members-top h4")
    ) {
      openModal(memberModal);
    }

    // Mở Modal Thêm Thành Viên
    if (target.classList.contains("btn-add-member")) {
      addMemberForm.reset();
      clearErrors();
      openModal(addMemberModal);
    }

    // Mở Modal Thêm Task
    if (target.classList.contains("btn-add-task")) {
      if (currentProject.members.length === 0) {
        alert("Dự án chưa có thành viên. Vui lòng thêm thành viên trước!");
        return;
      }
      taskForm.reset();
      clearErrors();
      editingTaskId = null;
      document.querySelector("#taskModal h3").innerText = "Thêm nhiệm vụ mới";
      openModal(taskModal);
    }

    // Sửa Task
    if (target.classList.contains("btn-edit")) {
      editingTaskId = Number(target.closest("tr").dataset.id);
      const task = allTasks.find((t) => t.id === editingTaskId);
      if (task) {
        document.getElementById("taskName").value = task.taskName;
        document.getElementById("assignee").value = task.assigneeId;
        document.getElementById("status").value = task.status
          .toLowerCase()
          .replace(/\s/g, "");
        document.getElementById("startDate").value = task.asignDate;
        document.getElementById("endDate").value = task.dueDate;
        document.getElementById("priority").value =
          task.priority === "Thấp"
            ? "low"
            : task.priority === "Trung bình"
              ? "medium"
              : "high";
        document.getElementById("progress").value =
          task.progress === "Đúng tiến độ"
            ? "ontrack"
            : task.progress === "Có rủi ro"
              ? "atrisk"
              : "late";

        document.querySelector("#taskModal h3").innerText =
          "Chỉnh sửa nhiệm vụ";
        openModal(taskModal);
      }
    }

    // Xóa Task
    if (target.classList.contains("btn-delete")) {
      deletingTaskId = Number(target.closest("tr").dataset.id);
      openModal(deleteModal);
    }

    // Đóng Modals
    if (
      target.classList.contains("close-modal") ||
      target.classList.contains("btn-cancel") ||
      (target.classList.contains("modal-overlay") &&
        !target.closest(".modal-card"))
    ) {
      closeModal();
    }
    if (
      target.closest("#modalMembers") &&
      target.classList.contains("btn-confirm")
    ) {
      showSuccessMsg("Đã lưu thay đổi thành viên!");
      closeModal();
      return;
    }

    // Đóng Modals (dấu X, nút Hủy, click ra ngoài)
    if (
      target.classList.contains("close-modal") ||
      target.classList.contains("btn-cancel") ||
      (target.classList.contains("modal-overlay") &&
        !target.closest(".modal-card"))
    ) {
      closeModal();
    }
  });

  // --- LƯU TASK (Thêm/Sửa) ---
  taskForm.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.remove("input-error");
      const err = this.nextElementSibling;
      if (err && err.classList.contains("error-text"))
        err.style.display = "none";
    });
  });

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();
    let isValid = true;

    const name = document.getElementById("taskName").value.trim();
    const assignee = document.getElementById("assignee").value;
    const statusVal = document.getElementById("status").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const priorityVal = document.getElementById("priority").value;
    const progressVal = document.getElementById("progress").value;

    // Validation Task
    if (!name || name.length < 5) {
      showError("taskName", "Tên tối thiểu 5 ký tự.");
      isValid = false;
    }
    if (!assignee) {
      showError("assignee", "Bắt buộc chọn.");
      isValid = false;
    }
    if (!statusVal) {
      showError("status", "Bắt buộc chọn.");
      isValid = false;
    }
    // 1. Kiểm tra Ngày bắt đầu phải LỚN HƠN ngày hiện tại
    if (!startDate) {
      showError("startDate", "Vui lòng chọn ngày bắt đầu.");
      isValid = false;
    } else {
      const start = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Đưa về 0h để so sánh chính xác theo ngày

      // Chỉ kiểm tra điều kiện này khi THÊM MỚI (không áp dụng khi đang SỬA task cũ đã bắt đầu)
      if (!editingTaskId && start <= today) {
        showError("startDate", "Ngày bắt đầu phải lớn hơn ngày hiện tại.");
        isValid = false;
      }
    }

    // 2. Kiểm tra Hạn chót
    if (!endDate) {
      showError("endDate", "Vui lòng chọn hạn chót.");
      isValid = false;
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      showError("endDate", "Hạn chót phải sau ngày bắt đầu.");
      isValid = false;
    }
    if (!priorityVal) {
      showError("priority", "Bắt buộc chọn.");
      isValid = false;
    }
    if (!progressVal) {
      showError("progress", "Bắt buộc chọn.");
      isValid = false;
    }

    if (!isValid) return;

    // Data mapping
    const priorityVN =
      priorityVal === "low"
        ? "Thấp"
        : priorityVal === "medium"
          ? "Trung bình"
          : "Cao";
    const progressVN =
      progressVal === "ontrack"
        ? "Đúng tiến độ"
        : progressVal === "atrisk"
          ? "Có rủi ro"
          : "Trễ hạn";
    const statusMap = {
      todo: "To do",
      inprogress: "In progress",
      pending: "Pending",
      done: "Done",
    };

    const taskData = {
      id: editingTaskId || Date.now(),
      taskName: name,
      assigneeId: Number(assignee),
      projectId: projectId,
      asignDate: startDate,
      dueDate: endDate,
      priority: priorityVN,
      progress: progressVN,
      status: statusMap[statusVal],
    };

    if (editingTaskId) {
      const index = allTasks.findIndex((t) => t.id === editingTaskId);
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

  // --- XÓA TASK ---
  document.getElementById("btnConfirmDelete").addEventListener("click", () => {
    allTasks = allTasks.filter((t) => t.id !== deletingTaskId);
    localStorage.setItem("tasks", JSON.stringify(allTasks));
    showSuccessMsg("Đã xóa nhiệm vụ!");
    renderTasks();
    closeModal();
  });

  // CHẠY KHỞI TẠO
  renderMembers();
  renderTasks();
});
