document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('myTaskTable');

    table.addEventListener('click', (e) => {
        const headerRow = e.target.closest('.group-header-row');
        
        if (headerRow) {
            const projectId = headerRow.getAttribute('data-project');
            const isCollapsed = headerRow.classList.toggle('collapsed');
            
            // Cập nhật icon mũi tên
            const cell = headerRow.cells[0];
            if (isCollapsed) {
                cell.innerText = cell.innerText.replace('▼', '▶');
            } else {
                cell.innerText = cell.innerText.replace('▶', '▼');
            }

            // Tìm và ẩn/hiện các hàng nhiệm vụ thuộc dự án này
            const allTaskRows = document.querySelectorAll(`.task-row[data-parent="${projectId}"]`);
            allTaskRows.forEach(row => {
                row.style.display = isCollapsed ? 'none' : 'table-row';
            });
        }
    });

    // Xử lý khởi tạo cho các nhóm đã bị đóng sẵn (collapsed)
    document.querySelectorAll('.group-header-row.collapsed').forEach(header => {
        const projectId = header.getAttribute('data-project');
        document.querySelectorAll(`.task-row[data-parent="${projectId}"]`).forEach(row => {
            row.style.display = 'none';
        });
    });
});