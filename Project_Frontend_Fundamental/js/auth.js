(function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const path = window.location.pathname;
    const page = path.split("/").pop(); // Lấy tên file 
    // 1. Nếu CHƯA đăng nhập mà đòi vào các trang quản lý
    if (!isLoggedIn && page !== 'login.html' && page !== 'register.html') {
        window.location.href = 'login.html';
    }
    // 2. Nếu ĐÃ đăng nhập mà vẫn cố vào trang login/register
    if (isLoggedIn && (page === 'login.html' || page === 'register.html')) {
        window.location.href = 'project-manager.html';
    }
})();