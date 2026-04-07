// js/common.js
document.addEventListener('DOMContentLoaded', function() {
    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            // Chặn chuyển hướng ngay lập tức của thẻ <a>
            e.preventDefault();
            // Xóa sạch dấu vết đăng nhập
            localStorage.removeItem('isLoggedIn');
            // Chuyển hướng về login
            window.location.href = 'login.html';
        });
    }
});
// js/common.js
// Tìm nút đăng xuất trong HTML và gán sự kiện
const btnLogout = document.querySelector('.btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', function(e) {
        // Xóa sạch dấu vết đăng nhập
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        // Trình duyệt sẽ tự chuyển về login.html theo link href trong thẻ <a>
    });
} 