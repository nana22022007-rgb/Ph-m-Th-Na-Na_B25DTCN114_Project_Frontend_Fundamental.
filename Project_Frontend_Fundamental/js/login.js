document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("loginEmailError");
    const passError = document.getElementById("loginPassError");

    if (!loginForm) return;

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // Luôn lấy danh sách users mới nhất từ localStorage khi nhấn nút
        const users = JSON.parse(localStorage.getItem("users")) || [];

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // 1. Reset trạng thái lỗi
        emailError.innerText = "";
        passError.innerText = "";
        emailInput.style.borderColor = "#DEE2E6";
        passwordInput.style.borderColor = "#DEE2E6";

        let hasEmptyField = false;

        // 2. KIỂM TRA BỎ TRỐNG
        if (!email) {
            emailError.innerText = "Vui lòng nhập email.";
            emailInput.style.borderColor = "#ff4d4d";
            hasEmptyField = true;
        }

        if (!password) {
            passError.innerText = "Vui lòng nhập mật khẩu.";
            passwordInput.style.borderColor = "#ff4d4d";
            hasEmptyField = true;
        }

        if (hasEmptyField) return;

        // 3. KIỂM TRA ĐĂNG NHẬP
        // const user = users.find((u) => u.email === email && u.password === password);
        // Thay đổi dòng này trong login.js của bạn:
        const user = users.find((u) => u.email.trim().toLowerCase() === email.toLowerCase() && u.password === password);

        if (user) {
            // Thành công: Lưu cả flag login và thông tin user
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", JSON.stringify(user));
            Swal.fire({
                title: "Đăng nhập thành công",
                text: "Đang chuyển hướng...",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = "./project-manager.html";
            });
        } else {
            // Thất bại
            passError.innerText = "Thông tin đăng nhập không chính xác.";
            emailInput.style.borderColor = "#ff4d4d";
            passwordInput.style.borderColor = "#ff4d4d";
            emailError.innerText = "";
        }
    });

    // UX: Khi người dùng gõ lại thì xóa báo đỏ ngay lập tức
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener("input", function () {
            emailError.innerText = "";
            passError.innerText = "";
            this.style.borderColor = "#2563EB"; // Đổi sang màu xanh khi đang focus gõ
        });
    });
});