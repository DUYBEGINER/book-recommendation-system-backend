[]Thêm tính năng giới hạn số lần thử đăng nhập thất bại của người dùng

[]Hiện tại chỉ cho đăng nhập dùng email đã đăng kí chưa sử dụng đến username

[x]Đăng kí xong thì front end bắt đăng nhập nhưng trong redis đã lưu session. (cần fix)

[]Tích hợp tính năng active tài khoản qua gmail (xác thực gmail); (sửa code ở authCOntroller, service để lấy hoặc tạo tài khoản với trường is_activate).

[x]Khi cập nhật thông tin người dùng thì thông tin trong accesstoken không đổi, nên giao diện không cập nhật đúng, (fix sau).

[]Thêm kiểm tra auth khi gọi api.

[]Phần cập nhật thông tin sách chưa cập nhật được ảnh

[]Thêm cập nhật ảnh profile

[]Giao diện sửa sách chưa có dark mode

[] Việc token có thời gian hết hạn 15 phút có thể dẫn tới nguy cơ bảo mật, nếu ai có được token còn thời hạn có thể đổi được mật khẩu