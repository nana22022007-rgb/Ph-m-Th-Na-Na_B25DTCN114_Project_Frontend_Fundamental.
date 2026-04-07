const users = JSON.parse(localStorage.getItem("users")) || [];
const registerForm = document.getElementById("registerForm");

// input
const fullnameInput = document.getElementById("fullname");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

//  lỗi
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

// RESET 
const inputs = [fullnameInput, emailInput, passwordInput, confirmPasswordInput];
const errors = [nameError, emailError, passwordError, confirmPasswordError];

inputs.forEach((input, index) => {
    input.addEventListener("input", function () {
        errors[index].innerText = ""; // Xóa chữ lỗi 
        input.style.borderColor = ""; //về màu viền mặc định
    });
});

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullname = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let isValid = true;

    // Reset toàn bộ màu viền về mặc định trước khi check
    inputs.forEach(input => input.style.borderColor = "#DEE2E6");
    errors.forEach(error => error.innerText = "");

    if (!fullname) {
        nameError.innerText = "Họ và tên không được để trống";
        fullnameInput.style.borderColor = "#ff4d4d";
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        emailError.innerText = "Email không được để trống";
        emailInput.style.borderColor = "#ff4d4d";
        isValid = false;
    } else if (!emailRegex.test(email)) {
        emailError.innerText = "Email không đúng định dạng";
        emailInput.style.borderColor = "#ff4d4d";
        isValid = false;
    }

    if (!password) {
        passwordError.innerText = "Mật khẩu không được để trống";
        passwordInput.style.borderColor = "#ff4d4d";
        isValid = false;
    } else if (password.length < 8) {
        passwordError.innerText = "Mật khẩu phải có tối thiểu 8 ký tự";
        passwordInput.style.borderColor = "#ff4d4d";
        isValid = false;
    }

    if (!confirmPassword) {
        confirmPasswordError.innerText = "Vui lòng xác nhận mật khẩu";
        confirmPasswordInput.style.borderColor = "#ff4d4d";
        isValid = false;
    } else if (confirmPassword !== password) {
        confirmPasswordError.innerText = "Mật khẩu xác nhận không trùng khớp";
        confirmPasswordInput.style.borderColor = "#ff4d4d";
        isValid = false;
    }

    if (!isValid) return;

    const isExistEmail = users.find((user) => user.email === email);
    if (isExistEmail) {
        emailError.innerText = "Email này đã được đăng ký";
        emailInput.style.borderColor = "#ff4d4d";
        return;
    }

    const maxId = users.length > 0 ? Math.max(...users.map(u => u.id)) : 0;

    const newUser = {
        id: maxId + 1, 
        fullname: fullname,
        email: email,
        password: password,
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    localStorage.setItem("currentUser", JSON.stringify(newUser));
    localStorage.setItem("isLoggedIn", "true");

    Swal.fire({
        title: "Đăng ký thành công",
        text: "Đang chuyển hướng...",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        window.location.href = "../pages/project-manager.html";
    });
});