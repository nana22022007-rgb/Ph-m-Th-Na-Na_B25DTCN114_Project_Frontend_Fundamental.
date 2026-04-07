// 1. Dữ liệu User 
const defaultUsers = [
    {
        id: 1,
        fullName: "An Nguyễn",
        email: "nguyenquangan@gmail.com",
        password: "12345678"
    },
    {
        id: 2,
        fullName: "Bình",
        email: "binh@gmail.com",
        password: "12345678"
    }
];

// 2. Dữ liệu Project
const defaultProjects = [
    {
        id: 1,
        projectName: "Xây dựng website thương mại điện tử",
        description: "Dự án học tập về web bán hàng sử dụng HTML/CSS/JS",
        members: [
            { userId: 1, role: "Project owner" },
            { userId: 2, role: "Frontend developer" }
        ]
    },
    {
        id: 2,
        projectName: "Ứng dụng Quản lý Tài chính",
        description: "Phần mềm giúp người dùng theo dõi thu chi cá nhân hàng tháng.",
        members: [
            { userId: 1, role: "Project owner" }
        ]
    },
    {
        id: 3,
        projectName: "Hệ thống Quản lý Thư viện",
        description: "Tra cứu sách, quản lý mượn trả và thông báo quá hạn.",
        members: [
            { userId: 2, role: "Project owner" },
            { userId: 1, role: "Backend developer" }
        ]
    }
];

// 3. Dữ liệu Task
const defaultTasks = [
    // Tasks cho Dự án 1
    {
        id: 1,
        taskName: "Soạn thảo đề cương dự án",
        assigneeId: 1,
        projectId: 1,
        asignDate: "2025-03-24",
        dueDate: "2025-03-26",
        priority: "Thấp",
        progress: "Đúng tiến độ",
        status: "To do"
    },
    {
        id: 2,
        taskName: "Thiết kế giao diện Figma",
        assigneeId: 2,
        projectId: 1,
        asignDate: "2025-03-25",
        dueDate: "2025-03-30",
        priority: "Trung bình",
        progress: "Trễ hạn",
        status: "In progress"
    },
    // Tasks cho Dự án 2
    {
        id: 3,
        taskName: "Thiết kế Database (LocalStorage)",
        assigneeId: 1,
        projectId: 2,
        asignDate: "2025-04-01",
        dueDate: "2025-04-03",
        priority: "Cao",
        progress: "Đúng tiến độ",
        status: "Done"
    },
    // Tasks cho Dự án 3
    {
        id: 4,
        taskName: "Viết API tra cứu sách",
        assigneeId: 1,
        projectId: 3,
        asignDate: "2025-04-05",
        dueDate: "2025-04-10",
        priority: "Cao",
        progress: "Đúng tiến độ",
        status: "To do"
    }
];

function initData() {
    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem("projects")) {
        localStorage.setItem("projects", JSON.stringify(defaultProjects));
    }
    if (!localStorage.getItem("tasks")) {
        localStorage.setItem("tasks", JSON.stringify(defaultTasks));
    }
}

initData();