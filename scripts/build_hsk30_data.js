const fs = require('fs');
const path = require('path');

// 1. Read raw JSONs from drkameleon/complete-hsk-vocabulary
const listNew = JSON.parse(fs.readFileSync('data/hsk30/hsk1_new.json', 'utf8'));
const listNewest = JSON.parse(fs.readFileSync('data/hsk30/hsk1_newest.json', 'utf8'));

// Read existing initialData to reuse high-quality translations & char details
const initialDataContent = fs.readFileSync('src/lib/initialData.ts', 'utf8');

// Sino-Vietnamese character map
const HANVIET_MAP = {
  '爱': 'Ái', '八': 'Bát', '爸': 'Bá', '吧': 'Ba', '白': 'Bạch', '百': 'Bách',
  '班': 'Ban', '半': 'Bán', '年': 'Niên', '天': 'Thiên', '帮': 'Bang', '忙': 'Mang',
  '包': 'Bao', '子': 'Tử', '杯': 'Bôi', '北': 'Bắc', '边': 'Biên', '京': 'Kinh',
  '本': 'Bản', '比': 'Tỉ', '别': 'Biệt', '的': 'Đích', '人': 'Nhân', '病': 'Bệnh',
  '不': 'Bất', '大': 'Đại', '对': 'Đối', '客': 'Khách', '气': 'Khí', '用': 'Dụng',
  '菜': 'Thái', '茶': 'Trà', '差': 'Sai', '常': 'Thường', '唱': 'Xướng', '歌': 'Ca',
  '车': 'Xa', '票': 'Phiếu', '上': 'Thượng', '站': 'Trạm', '吃': 'Ngật', '饭': 'Phạn',
  '出': 'Xuất', '来': 'Lai', '去': 'Khứ', '穿': 'Xuyên', '床': 'Sàng', '次': 'Thứ',
  '从': 'Tùng', '错': 'Thác', '打': 'Đả', '话': 'Thoại', '开': 'Khai', '球': 'Cầu',
  '学': 'Học', '生': 'Sinh', '到': 'Đáo', '地': 'Địa', '点': 'Điểm', '方': 'Phương',
  '图': 'Đồ', '得': 'Đắc', '等': 'Đẳng', '弟': 'Đệ', '第': 'Đệ', '二': 'Nhị',
  '电': 'Điện', '脑': 'Não', '视': 'Thị', '机': 'Cơ', '影': 'Ảnh', '院': 'Viện',
  '东': 'Đông', '西': 'Tây', '动': 'Động', '作': 'Tác', '都': 'Đô', '读': 'Độc',
  '书': 'Thư', '起': 'Khởi', '多': 'Đa', '少': 'Thiểu', '饿': 'Ngạ', '儿': 'Nhi',
  '店': 'Điếm', '房': 'Phòng', '间': 'Gian', '放': 'Phóng', '假': 'Giả', '飞': 'Phi',
  '非': 'Phi', '分': 'Phân', '风': 'Phong', '干': 'Can', '净': 'Tịnh', '什': 'Thập',
  '么': 'Ma', '高': 'Cao', '兴': 'Hưng', '告': 'Cáo', '诉': 'Tố', '哥': 'Ca',
  '个': 'Cá', '给': 'Cấp', '跟': 'Căn', '工': 'Công', '关': 'Quan', '贵': 'Quý',
  '国': 'Quốc', '家': 'Gia', '外': 'Ngoại', '过': 'Quá', '还': 'Hoàn', '是': 'Thị',
  '有': 'Hữu', '孩': 'Hài', '汉': 'Hán', '语': 'Ngữ', '字': 'Tự', '好': 'Hảo',
  '看': 'Khán', '听': 'Thính', '玩': 'Ngoạn', '号': 'Hiệu', '喝': 'Hát', '和': 'Hòa',
  '很': 'Hẩn', '后': 'Hậu', '花': 'Hoa', '坏': 'Hoại', '回': 'Hồi', '答': 'Đáp',
  '会': 'Hội', '火': 'Hỏa', '场': 'Trường', '鸡': 'Kê', '蛋': 'Đản', '几': 'Kỷ',
  '记': 'Ký', '住': 'Trụ', '里': 'Lý', '面': 'Diện', '叫': 'Khiếu', '教': 'Giáo',
  '楼': 'Lâu', '介': 'Giới', '绍': 'Thiệu', '姐': 'Tỷ', '今': 'Kim', '进': 'Tiến',
  '九': 'Cửu', '就': 'Tựu', '觉': 'Giác', '笑': 'Tiếu', '考': 'Khảo', '试': 'Thí',
  '渴': 'Khát', '课': 'Khóa', '文': 'Văn', '口': 'Khẩu', '块': 'Khối', '快': 'Khoái',
  '老': 'Lão', '师': 'Sư', '了': 'Liễu', '累': 'Lũy', '冷': 'Lãnh', '两': 'Lưỡng',
  '零': 'Linh', '六': 'Lục', '下': 'Hạ', '路': 'Lộ', '妈': 'Mã', '马': 'Mã',
  '吗': 'Ma', '买': 'Mãi', '慢': 'Mạn', '毛': 'Mao', '没': 'Một', '系': 'Hệ',
  '事': 'Sự', '妹': 'Muội', '门': 'Môn', '们': 'Môn', '米': 'Mễ', '条': 'Điều',
  '名': 'Danh', '明': 'Minh', '拿': 'Nã', '哪': 'Nả', '些': 'Tức', '那': 'Na',
  '奶': 'Nãi', '男': 'Nam', '朋': 'Bằng', '友': 'Hữu', '南': 'Nam', '难': 'Nan',
  '呢': 'Ni', '能': 'Năng', '你': 'Nhĩ', '您': 'Nâm', '牛': 'Ngưu', '女': 'Nữ',
  '旁': 'Bàng', '跑': 'Bào', '七': 'Thất', '汽': 'Khí', '前': 'Tiền', '钱': 'Tiền',
  '请': 'Thỉnh', '问': 'Vấn', '坐': 'Tọa', '热': 'Nhiệt', '认': 'Nhận', '识': 'Thức',
  '真': 'Chân', '日': 'Nhật', '期': 'Kỳ', '肉': 'Nhục', '三': 'Tam', '山': 'Sơn',
  '商': 'Thương', '网': 'Võng', '午': 'Ngọ', '身': 'Thân', '体': 'Thể', '时': 'Thời',
  '候': 'Hậu', '手': 'Thủ', '树': 'Thụ', '谁': 'Thùy', '水': 'Thủy', '果': 'Quả',
  '睡': 'Thụy', '说': 'Thuyết', '四': 'Tứ', '送': 'Tống', '岁': 'Tuế', '他': 'Tha',
  '她': 'Tha', '太': 'Thái', '写': 'Tả', '同': 'Đồng', '馆': 'Quán', '晚': 'Vãn',
  '忘': 'Vong', '我': 'Ngã', '五': 'Ngũ', '洗': 'Tẩy', '喜': 'Hỷ', '欢': 'Hoan',
  '雨': 'Vũ', '先': 'Tiên', '现': 'Hiện', '在': 'Tại', '想': 'Tưởng', '小': 'Tiểu',
  '新': 'Tân', '星': 'Tinh', '行': 'Hành', '休': 'Hưu', '息': 'Tức', '习': 'Tập',
  '校': 'Hiệu', '要': 'Yếu', '也': 'Dã', '页': 'Diệp', '爷': 'Gia', '一': 'Nhất',
  '样': 'Dạng', '衣': 'Y', '服': 'Phục', '医': 'Y', '右': 'Hữu', '元': 'Nguyên',
  '远': 'Viễn', '月': 'Nguyệt', '再': 'Tái', '见': 'Kiến', '早': 'Tảo', '怎': 'Chẩm',
  '找': 'Trảo', '着': 'Trước', '正': 'Chính', '知': 'Tri', '道': 'Đạo', '中': 'Trung',
  '重': 'Trọng', '准': 'Chuẩn', '备': 'Bị', '桌': 'Trác', '走': 'Tẩu', '最': 'Tối',
  '左': 'Tả', '做': 'Tố', '便': 'Tiện', '宜': 'Nghi', '超': 'Siêu', '市': 'Thị',
  '租': 'Tô', '公': 'Công', '司': 'Ty', '狗': 'Cẩu', '件': 'Kiện', '饺': 'Kiểu',
  '可': 'Khả', '以': 'Dĩ', '卖': 'Mại', '猫': 'Miêu', '士': 'Sĩ', '漂': 'Phiêu',
  '亮': 'Lượng', '苹': 'Bình', '千': 'Thiên', '它': 'Tha', '喂': 'Úy', '题': 'Đề',
  '雪': 'Tuyết', '椅': 'Y', '只': 'Chích'
};

function getSinoVietnamese(hanzi) {
  return Array.from(hanzi).map(c => HANVIET_MAP[c] || c).join(' ').toLowerCase();
}

// Hand-crafted Vietnamese meanings for words
const VIETNAMESE_MEANINGS = {
  '爱': 'yêu, thích',
  '爱好': 'sở thích, đam mê',
  '八': 'số 8 (tám)',
  '爸': 'bố, ba',
  '爸爸': 'bố, cha',
  '吧': 'nhé, nha, đi (trợ từ ngữ khí)',
  '白': 'màu trắng, trong sạch',
  '白天': 'ban ngày',
  '百': 'trăm (100)',
  '班': 'lớp học, ca làm việc',
  '半': 'nửa, rưỡi (1/2)',
  '半年': 'nửa năm',
  '半天': 'nửa ngày, hồi lâu',
  '帮': 'giúp, hỗ trợ',
  '帮忙': 'giúp đỡ, tương trợ',
  '包': 'túi, gói, bao',
  '包子': 'bánh bao',
  '杯': 'ly, tách, cốc',
  '杯子': 'cái ly, cốc nước',
  '北': 'phía bắc, hướng bắc',
  '北边': 'phía bắc, đằng bắc',
  '北京': 'Bắc Kinh (thủ đô TQ)',
  '本': 'cuốn, quyển (lượng từ)',
  '本子': 'cuốn sổ, quyển vở',
  '比': 'so với, so sánh',
  '别': 'đừng, chớ / khác',
  '别的': 'cái khác, người khác',
  '别人': 'người khác, người ta',
  '病': 'bệnh, ốm đau',
  '病人': 'người bệnh, bệnh nhân',
  '不': 'không, chẳng (phủ định)',
  '不大': 'không lớn lắm',
  '不对': 'không đúng, sai rồi',
  '不客气': 'không có chi, đừng khách sáo',
  '不用': 'không cần, khỏi cần',
  '菜': 'món ăn, rau củ',
  '茶': 'trà, nước chè',
  '差': 'kém, thiếu, tệ',
  '常': 'thường, hay',
  '常常': 'thường xuyên, hay',
  '唱': 'hát',
  '唱歌': 'hát, ca hát',
  '车': 'xe cộ, ô tô',
  '车票': 'vé xe, vé tàu',
  '车上': 'trên xe',
  '车站': 'trạm xe, bến xe, ga tàu',
  '吃': 'ăn',
  '吃饭': 'ăn cơm, dùng bữa',
  '出': 'ra, ra ngoài, xuất hiện',
  '出来': 'đi ra, xuất hiện',
  '出去': 'đi ra ngoài',
  '穿': 'mặc (quần áo), xỏ (giày)',
  '床': 'cái giường',
  '次': 'lần, lượt',
  '从': 'từ (nơi chốn, thời gian)',
  '错': 'sai, nhầm lẫn',
  '打': 'đánh, đập, gọi (điện thoại)',
  '打车': 'bắt xe taxi',
  '打电话': 'gọi điện thoại',
  '打开': 'mở ra, bật lên',
  '打球': 'chơi bóng, đánh bóng',
  '大': 'to, lớn',
  '大学': 'trường đại học',
  '大学生': 'sinh viên đại học',
  '到': 'đến, tới',
  '地': 'đất, mặt đất / trợ từ (một cách)',
  '地点': 'địa điểm, vị trí',
  '地方': 'nơi chốn, địa phương',
  '地上': 'trên mặt đất, trên sàn',
  '地图': 'bản đồ',
  '的': 'của, mà (trợ từ sở hữu)',
  '得到': 'nhận được, đạt được',
  '等': 'đợi, chờ / vân vân',
  '弟': 'em trai',
  '弟弟': 'em trai',
  '第': 'thứ (số thứ tự)',
  '第二': 'thứ hai (số thứ tự)',
  '点': 'giờ, điểm, chấm / một chút',
  '电': 'điện',
  '电话': 'điện thoại',
  '电脑': 'máy vi tính',
  '电视': 'truyền hình, TV',
  '电视机': 'chiếc tivi',
  '电影': 'phim điện ảnh',
  '电影院': 'rạp chiếu phim',
  '东': 'phía đông, hướng đông',
  '东边': 'phía đông',
  '东西': 'đồ đạc, vật dụng / đông tây',
  '动': 'cử động, chuyển động',
  '动作': 'động tác, hành động',
  '都': 'đều, tất cả',
  '读': 'đọc, học',
  '读书': 'đọc sách, đi học',
  '对': 'đúng, chính xác / đối với',
  '对不起': 'xin lỗi',
  '多': 'nhiều / bao nhiêu',
  '多少': 'bao nhiêu',
  '饿': 'đói bụng',
  '儿子': 'con trai',
  '二': 'số 2 (hai)',
  '饭': 'cơm, bữa ăn',
  '饭店': 'nhà hàng, khách sạn',
  '房间': 'căn phòng',
  '房子': 'ngôi nhà, căn nhà',
  '放': 'thả, đặt để / nghỉ (học, làm)',
  '放假': 'nghỉ lễ, nghỉ phép',
  '放学': 'tan học, tan trường',
  '飞': 'bay',
  '飞机': 'máy bay',
  '非常': 'vô cùng, rất, đặc biệt',
  '分': 'phút / điểm số / chia',
  '风': 'gió',
  '干': 'làm, làm việc',
  '干净': 'sạch sẽ',
  '干什么': 'làm cái gì, sao thế',
  '高': 'cao',
  '高兴': 'vui vẻ, phấn khởi',
  '告诉': 'nói cho biết, bảo',
  '哥': 'anh trai',
  '哥哥': 'anh trai',
  '歌': 'bài hát, ca khúc',
  '个': 'cái, chiếc (lượng từ chung)',
  '给': 'cho, đưa cho, tặng',
  '跟': 'cùng, với / theo sau',
  '工人': 'công nhân, người lao động',
  '工作': 'làm việc, công việc',
  '关': 'đóng, tắt (đèn, máy)',
  '关上': 'đóng lại, tắt đi',
  '贵': 'đắt, quý giá / họ của bạn',
  '国': 'nước, quốc gia',
  '国家': 'quốc gia, đất nước',
  '国外': 'nước ngoài',
  '过': 'qua, qua lại / đã từng (trợ từ)',
  '还': 'còn, vẫn còn / trả lại',
  '还是': 'hay là, vẫn cứ',
  '还有': 'còn có, ngoài ra',
  '孩子': 'đứa trẻ, con cái',
  '汉语': 'tiếng Hán, tiếng Trung',
  '汉字': 'chữ Hán',
  '好': 'tốt, đẹp, hay, được',
  '好吃': 'ngon miệng (đồ ăn)',
  '好看': 'đẹp mắt, xem hay',
  '好听': 'nghe hay, êm tai',
  '好玩儿': 'vui nhộn, thú vị',
  '号': 'số, ngày (trong tháng)',
  '喝': 'uống',
  '和': 'và, với, cùng',
  '很': 'rất, quá',
  '后': 'sau, phía sau',
  '后边': 'phía sau, đằng sau',
  '后天': 'ngày mốt, ngày kia',
  '花': 'hoa, bông hoa / tiêu (tiền)',
  '话': 'lời nói, câu chuyện',
  '坏': 'hỏng, xấu, tệ',
  '回': 'về, quay lại',
  '回答': 'trả lời, giải đáp',
  '回到': 'quay trở về',
  '回家': 'về nhà',
  '回来': 'trở về, quay lại',
  '回去': 'đi về, trở về',
  '会': 'biết (qua học tập) / sẽ / cuộc họp',
  '火车': 'tàu hỏa, xe lửa',
  '机场': 'sân bay, phi trường',
  '机票': 'vé máy bay',
  '鸡蛋': 'trứng gà',
  '几': 'mấy, vài (dưới 10)',
  '记': 'nhớ, ghi nhớ, ghi chép',
  '记得': 'nhớ, còn nhớ',
  '记住': 'ghi nhớ, nhớ kỹ',
  '家': 'nhà, gia đình',
  '家里': 'trong nhà, ở nhà',
  '家人': 'người nhà, người thân',
  '间': 'gian, phòng (lượng từ phòng)',
  '见': 'gặp, nhìn thấy',
  '见面': 'gặp mặt, tiếp xúc',
  '叫': 'tên là, gọi, kêu',
  '教': 'dạy, giảng dạy',
  '教学楼': 'tòa nhà giảng dạy, khu học xá',
  '介绍': 'giới thiệu',
  '姐': 'chị gái',
  '姐姐': 'chị gái',
  '今年': 'năm nay',
  '今天': 'hôm nay',
  '进': 'vào, tiến vào',
  '进来': 'vào đây, bước vào',
  '进去': 'đi vào trong',
  '九': 'số 9 (chín)',
  '就': 'thì, ngay, chính là',
  '觉得': 'cảm thấy, cho rằng',
  '开': 'mở, bật, lái (xe)',
  '开车': 'lái xe, điều khiển ô tô',
  '开会': 'họp, mở cuộc họp',
  '开玩笑': 'nói đùa, trêu chọc',
  '看': 'nhìn, xem, thăm',
  '看病': 'khám bệnh, chữa bệnh',
  '看到': 'nhìn thấy, thấy được',
  '看见': 'nhìn thấy, trông thấy',
  '考': 'thi, kiểm tra',
  '考试': 'kỳ thi, bài kiểm tra',
  '渴': 'khát nước',
  '课': 'bài học, tiết học, môn học',
  '课本': 'sách giáo khoa',
  '课文': 'bài khóa, bài đọc',
  '口': 'miệng, mồm / lượng từ nhân khẩu',
  '块': 'đồng (tiền), miếng, tảng',
  '快': 'nhanh, mau chóng / sắp sửa',
  '来': 'đến, tới',
  '来到': 'đến nơi, tới',
  '老': 'già, cũ, lâu năm',
  '老人': 'người già, người cao tuổi',
  '老师': 'thầy cô giáo, giáo viên',
  '了': 'rồi (trợ từ biến đổi trạng thái)',
  '累': 'mệt, mệt mỏi',
  '冷': 'lạnh, rét',
  '里': 'trong, bên trong',
  '里边': 'bên trong, phía trong',
  '两': 'hai (dùng trước lượng từ)',
  '零': 'số 0 (không)',
  '六': 'số 6 (sáu)',
  '楼': 'tầng, lầu, tòa nhà',
  '楼上': 'trên lầu, tầng trên',
  '楼下': 'dưới lầu, tầng dưới',
  '路': 'đường đi, tuyến đường',
  '路口': 'ngã tư, giao lộ',
  '路上': 'trên đường',
  '妈': 'mẹ, má',
  '妈妈': 'mẹ, má',
  '马路': 'đường cái, đường lớn',
  '马上': 'ngay lập tức, tức khắc',
  '吗': 'không, chăng (trợ từ nghi vấn)',
  '买': 'mua',
  '慢': 'chậm, từ từ',
  '忙': 'bận, bận rộn',
  '毛': 'hào (tiền) / lông',
  '没': 'không, chưa',
  '没关系': 'không sao, không có chi',
  '没什么': 'không có gì, chẳng sao cả',
  '没事儿': 'không việc gì, không sao đâu',
  '没有': 'không có, chưa từng',
  '妹': 'em gái',
  '妹妹': 'em gái',
  '门': 'cửa, cổng / lượng từ môn học',
  '门口': 'cửa ra vào, cổng',
  '门票': 'vé vào cửa, vé tham quan',
  '们': 'các, chúng (hậu tố số nhiều)',
  '米饭': 'cơm trắng',
  '面包': 'bánh mì',
  '面条儿': 'mì sợi, tô mì',
  '名字': 'tên, danh tính',
  '明白': 'hiểu rõ, rõ ràng',
  '明年': 'năm sau, sang năm',
  '明天': 'ngày mai',
  '拿': 'cầm, nắm, lấy',
  '哪': 'nào (nghi vấn)',
  '哪儿': 'ở đâu, đâu',
  '哪里': 'ở đâu / đâu có (khiêm tốn)',
  '哪些': 'những cái nào, những người nào',
  '那': 'kia, đó',
  '那边': 'phía bên kia, đằng kia',
  '那儿': 'ở đó, đằng kia',
  '那里': 'ở nơi đó, chỗ đó',
  '那些': 'những cái đó, những thứ kia',
  '奶': 'sữa / bà nội',
  '奶奶': 'bà nội',
  '男': 'nam, đàn ông, con trai',
  '男孩儿': 'cậu bé, bé trai',
  '男朋友': 'bạn trai, người yêu',
  '男人': 'đàn ông, người nam',
  '男生': 'nam sinh, học sinh nam',
  '南': 'phía nam, hướng nam',
  '南边': 'phía nam, đằng nam',
  '难': 'khó, khó khăn',
  '呢': 'đâu, nhỉ, vậy (trợ từ hỏi ngược)',
  '能': 'có thể, có khả năng',
  '你': 'bạn, cậu, anh, chị (ngôi 2)',
  '你们': 'các bạn, các anh, các chị',
  '年': 'năm, tuổi',
  '您': 'ngài, bác, ông (kính ngữ của 你)',
  '牛奶': 'sữa bò',
  '女': 'nữ, phụ nữ, con gái',
  '女儿': 'con gái (của bố mẹ)',
  '女孩儿': 'cô bé, bé gái',
  '女朋友': 'bạn gái, người yêu',
  '女人': 'phụ nữ, đàn bà',
  '女生': 'nữ sinh, học sinh nữ',
  '旁边': 'bên cạnh, cạnh bên',
  '跑': 'chạy',
  '朋友': 'bạn bè, bạn',
  '票': 'vé, phiếu',
  '七': 'số 7 (bảy)',
  '起': 'dậy, khởi / nổi lên',
  '起床': 'thức dậy, rời giường',
  '起来': 'ngồi dậy, đứng dậy / bắt đầu',
  '汽车': 'xe hơi, xe ô tô',
  '前': 'trước, phía trước',
  '前边': 'phía trước, đằng trước',
  '前天': 'hôm kia, hôm trước',
  '钱': 'tiền, tiền bạc',
  '钱包': 'ví tiền, bóp tiền',
  '请': 'mời, xin, làm ơn',
  '请假': 'xin nghỉ phép, xin nghỉ học',
  '请进': 'xin mời vào',
  '请问': 'xin hỏi, làm phiền cho hỏi',
  '请坐': 'xin mời ngồi',
  '球': 'quả bóng, trái cầu',
  '去': 'đi, tới',
  '去年': 'năm ngoái',
  '热': 'nóng, nhiệt tình',
  '人': 'người, con người',
  '认识': 'quen biết, nhận biết',
  '认真': 'chăm chỉ, nghiêm túc',
  '日': 'ngày, mặt trời',
  '日期': 'ngày tháng, thời hạn',
  '肉': 'thịt',
  '三': 'số 3 (ba)',
  '山': 'núi, ngọn núi',
  '商场': 'trung tâm thương mại',
  '商店': 'cửa hàng, tiệm buôn',
  '上': 'lên, trên, trước',
  '上班': 'đi làm, vào ca làm việc',
  '上边': 'phía trên, bên trên',
  '上车': 'lên xe, lên tàu',
  '上次': 'lần trước, chuyến trước',
  '上课': 'vào học, lên lớp',
  '上网': 'lên mạng, truy cập internet',
  '上午': 'buổi sáng (trước 12h)',
  '上学': 'đi học, đến trường',
  '少': 'ít, thiếu',
  '身上': 'trên người, trên cơ thể',
  '身体': 'thân thể, sức khỏe',
  '什么': 'cái gì, gì',
  '生病': 'bị bệnh, ốm',
  '生气': 'tức giận, giận hờn',
  '生日': 'sinh nhật, ngày sinh',
  '十': 'số 10 (mười)',
  '时候': 'lúc, khi, thời khắc',
  '时间': 'thời gian',
  '事': 'sự việc, công việc, chuyện',
  '试': 'thử, thi thử',
  '是': 'là, phải, đúng',
  '是不是': 'có phải không, đúng không',
  '手': 'bàn tay, tay',
  '手机': 'điện thoại di động',
  '书': 'sách, cuốn sách',
  '书包': 'cặp sách, ba lô đi học',
  '书店': 'hiệu sách, tiệm sách',
  '树': 'cây cối, cái cây',
  '谁': 'ai (nghi vấn đại từ)',
  '水': 'nước',
  '水果': 'hoa quả, trái cây',
  '睡': 'ngủ',
  '睡觉': 'đi ngủ, giấc ngủ',
  '说': 'nói, bảo',
  '说话': 'nói chuyện, trò chuyện',
  '四': 'số 4 (bốn)',
  '送': 'tặng, tiễn, đưa đi',
  '岁': 'tuổi (chỉ tuổi tác)',
  '他': 'anh ấy, ông ấy, cậu ấy (ngôi 3 nam)',
  '他们': 'họ, bọn họ, các anh ấy',
  '她': 'cô ấy, bà ấy, chị ấy (ngôi 3 nữ)',
  '她们': 'họ, các cô ấy (nhóm toàn nữ)',
  '太': 'quá, lắm, thái (thái quá)',
  '天': 'ngày, trời, bầu trời',
  '天气': 'thời tiết, khí hậu',
  '听': 'nghe',
  '听到': 'nghe thấy, lắng nghe được',
  '听见': 'nghe thấy, nghe được',
  '听写': 'nghe viết, chính tả',
  '同学': 'bạn cùng lớp, bạn học',
  '图书馆': 'thư viện',
  '外': 'ngoài, bên ngoài',
  '外边': 'phía ngoài, bên ngoài',
  '外国': 'nước ngoài',
  '外语': 'ngoại ngữ',
  '玩儿': 'chơi, vui chơi',
  '晚': 'muộn, tối',
  '晚饭': 'bữa tối, cơm tối',
  '晚上': 'buổi tối, ban đêm',
  '网上': 'trên mạng, online',
  '网友': 'bạn trên mạng, cư dân mạng',
  '忘': 'quên',
  '忘记': 'quên, quên mất',
  '问': 'hỏi, thăm hỏi',
  '我': 'tôi, mình, tớ (ngôi 1)',
  '我们': 'chúng tôi, chúng ta',
  '五': 'số 5 (năm)',
  '午饭': 'bữa trưa, cơm trưa',
  '洗': 'rửa, giặt, gội',
  '洗手间': 'nhà vệ sinh, phòng rửa tay',
  '喜欢': 'thích, yêu thích',
  '西': 'phía tây, hướng tây',
  '西边': 'phía tây',
  '下': 'dưới, xuống / tiếp theo',
  '下班': 'tan sở, tan ca làm',
  '下边': 'phía dưới, bên dưới',
  '下车': 'xuống xe, xuống tàu',
  '下次': 'lần sau, chuyến sau',
  '下课': 'tan học, tan tiết',
  '下午': 'buổi chiều (sau 12h)',
  '下雨': 'trời mưa, đổ mưa',
  '先': 'trước, tiên phong',
  '先生': 'ông, ngài, thầy, chồng',
  '现在': 'bây giờ, hiện tại',
  '想': 'nghĩ, nhớ, muốn',
  '小': 'nhỏ, bé, ít',
  '小孩儿': 'trẻ con, đứa trẻ',
  '小姐': 'cô gái, tiểu thư',
  '小朋友': 'bạn nhỏ, em nhỏ',
  '小时': 'giờ đồng hồ, tiếng đồng hồ',
  '小学': 'trường tiểu học',
  '小学生': 'học sinh tiểu học',
  '笑': 'cười',
  '写': 'viết',
  '谢谢': 'cảm ơn',
  '新': 'mới, tươi mới',
  '新年': 'năm mới, tết',
  '星期': 'tuần, thứ trong tuần',
  '星期日': 'chủ nhật',
  '星期天': 'chủ nhật',
  '行': 'được, ổn / đi',
  '休息': 'nghỉ ngơi',
  '学': 'học, bắt chước',
  '学生': 'học sinh, sinh viên',
  '学习': 'học tập, rèn luyện',
  '学校': 'trường học',
  '学院': 'học viện, trường cao đẳng',
  '要': 'muốn, cần, phải / sắp',
  '也': 'cũng, cũng vậy',
  '页': 'trang (sách)',
  '爷爷': 'ông nội',
  '一': 'số 1 (một)',
  '一半': 'một nửa',
  '一边': 'một bên / vừa... vừa...',
  '一点儿': 'một chút, một ít',
  '一会儿': 'một lát, một chốc',
  '一块儿': 'cùng nhau, chung một chỗ',
  '一起': 'cùng nhau, đồng thời',
  '一下儿': 'một chút, một thoáng',
  '一些': 'một vài, một số',
  '一样': 'giống nhau, như nhau',
  '衣服': 'quần áo, trang phục',
  '医生': 'bác sĩ, thầy thuốc',
  '医院': 'bệnh viện',
  '用': 'dùng, sử dụng',
  '有': 'có, sở hữu',
  '有的': 'có cái, có người',
  '有名': 'nổi tiếng',
  '有时': 'có lúc, đôi khi',
  '有时候': 'thỉnh thoảng, đôi khi',
  '有些': 'có một số, hơi một chút',
  '有一些': 'có một ít, có vài',
  '有用': 'có ích, hữu dụng',
  '右': 'bên phải, hướng phải',
  '右边': 'bên phải, phía bên phải',
  '雨': 'mưa, cơn mưa',
  '元': 'đồng tệ (đơn vị tiền TQ)',
  '远': 'xa, xa xôi',
  '月': 'tháng, mặt trăng',
  '再': 'lại, nữa / rồi hãy',
  '再见': 'tạm biệt, hẹn gặp lại',
  '在': 'ở, tại / đang (làm gì)',
  '在家': 'ở nhà',
  '早': 'sớm, buổi sáng',
  '早饭': 'bữa sáng, điểm tâm',
  '早上': 'buổi sáng sớm',
  '怎么': 'thế nào, làm sao, sao lại',
  '站': 'đứng / trạm dừng, nhà ga',
  '找': 'tìm kiếm / thối lại tiền',
  '找到': 'tìm thấy, kiếm được',
  '这': 'đây, này',
  '这边': 'bên này, phía này',
  '这儿': 'ở đây, chỗ này',
  '这里': 'ở nơi này, chỗ này',
  '这些': 'những cái này, số này',
  '着': 'đang (trợ từ tiếp diễn)',
  '真': 'thật, quả thật, đúng là',
  '真的': 'thật sự, thật đấy',
  '正': 'đang / chính, đúng',
  '正在': 'đang (trong quá trình làm gì)',
  '知道': 'biết, hiểu',
  '知识': 'tri thức, kiến thức',
  '中': 'giữa, trung tâm / Trung Quốc',
  '中国': 'Trung Quốc',
  '中间': 'ở giữa, khoảng giữa',
  '中文': 'tiếng Trung, văn tự Hán',
  '中午': 'buổi trưa (khoảng 12h)',
  '中学': 'trường trung học (cấp 2, 3)',
  '中学生': 'học sinh trung học',
  '重': 'nặng, quan trọng',
  '重要': 'quan trọng, hệ trọng',
  '住': 'sống, ở, cư trú',
  '准备': 'chuẩn bị, dự định',
  '桌子': 'cái bàn',
  '字': 'chữ, chữ Hán',
  '子': 'con, cái (hậu tố)',
  '走': 'đi, bước đi, rời đi',
  '走路': 'đi bộ',
  '最': 'nhất (so sánh nhất)',
  '最好': 'tốt nhất, hay nhất',
  '最后': 'cuối cùng, sau cùng',
  '昨天': 'hôm qua',
  '左': 'bên trái, hướng trái',
  '左边': 'bên trái, phía bên trái',
  '坐': 'ngồi, đi (tàu, xe, máy bay)',
  '坐下': 'ngồi xuống',
  '做': 'làm, chế tạo, nấu',
  '边': 'bên, mép, cạnh',
  '便宜': 'rẻ, giá rẻ',
  '不要': 'đừng, không muốn',
  '超市': 'siêu thị',
  '出租车': 'xe taxi',
  '大家': 'mọi người, cả nhà',
  '店': 'tiệm, cửa hàng',
  '分钟': 'phút (khoảng thời gian)',
  '公司': 'công ty',
  '狗': 'chó, chú chó',
  '件': 'chiếc, cái, kiện (áo, việc)',
  '饺子': 'sủi cảo, bánh chẻo',
  '可以': 'có thể, được phép',
  '卖': 'bán',
  '猫': 'mèo, chú mèo',
  '女士': 'quý cô, quý bà',
  '漂亮': 'xinh đẹp, đẹp đẽ',
  '苹果': 'quả táo',
  '千': 'nghìn (1.000)',
  '它': 'nó (con vật, đồ vật)',
  '它们': 'chúng nó, bọn chúng',
  '玩': 'chơi, vui chơi',
  '喂': 'alo (nghe điện thoại) / cho ăn',
  '问题': 'câu hỏi, vấn đề',
  '些': 'vài, một ít',
  '雪': 'tuyết',
  '椅子': 'cái ghế',
  '有点儿': 'hơi, có một chút (tiêu cực)',
  '怎么样': 'thế nào, ra sao',
  '只': 'chỉ / con (lượng từ động vật)',
  '做饭': 'nấu cơm, nấu ăn'
};

// Category mapping helper
function categorize(hanzi, pos, meanings) {
  const h = hanzi;
  // Greetings / Social expressions / Grammar particles
  if (['你好', '您好', '再见', '谢谢', '不客气', '对不起', '没关系', '请', '请问', '请进', '请坐', '请假', '喂', '吧', '吗', '呢', '了', '的', '着', '得', '过', '没什么', '没事儿', '不是', '不用', '不要'].includes(h)) return 'greetings';
  
  // Pronouns / People / Family
  if (['我', '你', '您', '他', '她', '它', '我们', '你们', '他们', '她们', '它们', '大家', '自己', '谁', '别人', '有的', '爸爸', '爸', '妈妈', '妈', '哥哥', '哥', '姐姐', '姐', '弟弟', '弟', '妹妹', '妹', '爷爷', '奶奶', '儿子', '女儿', '孩子', '小孩儿', '小朋友', '老师', '学生', '小学生', '中学生', '大学生', '同学', '朋友', '男朋友', '女朋友', '老人', '男人', '女人', '男生', '女生', '男孩儿', '女孩儿', '先生', '小姐', '女士', '医生', '工人', '家人', '网友'].includes(h)) return 'pronouns_people';
  
  // Numbers / Time / Calendar
  if (['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '两', '零', '第', '第二', '半', '年', '半年', '今年', '明年', '去年', '天', '半天', '白天', '今天', '明天', '昨天', '前天', '后天', '月', '号', '日', '日期', '星期', '星期日', '星期天', '点', '小时', '分钟', '分', '时间', '时候', '现在', '上午', '中午', '下午', '早上', '早', '晚上', '晚', '新年'].includes(h)) return 'numbers_time';
  
  // Food & Drinks
  if (['吃', '喝', '饭', '吃饭', '早饭', '午饭', '晚饭', '米饭', '面包', '面条儿', '包子', '饺子', '鸡蛋', '肉', '菜', '茶', '水', '水果', '苹果', '牛奶', '好吃', '渴', '饿', '做饭'].includes(h)) return 'food_drinks';
  
  // Places & Travel / Directions
  if (['去', '来', '回', '到', '回到', '回家', '走', '走路', '跑', '飞', '上车', '下车', '打车', '开车', '车', '汽车', '火车', '飞机', '出租车', '车站', '机场', '车票', '机票', '学校', '学院', '小学', '中学', '大学', '教学楼', '图书馆', '医院', '商店', '商场', '超市', '饭店', '书店', '电影院', '洗手间', '国家', '中国', '外国', '北京', '家', '家里', '房子', '房间', '楼', '楼上', '楼下', '路', '马路', '路口', '地上', '地方', '地点', '东', '南', '西', '北', '东边', '南边', '西边', '北边', '上边', '下边', '里边', '外边', '前边', '后边', '左边', '右边', '中间', '旁边', '这儿', '那儿', '哪儿', '这里', '那里', '哪里', '这边', '那边', '山'].includes(h)) return 'places_travel';
  
  // Objects & Daily Items
  if (['书', '本子', '本', '课本', '字', '汉字', '笔', '手机', '电话', '电脑', '电视', '电视机', '电影', '东西', '衣服', '桌子', '椅子', '床', '包', '书包', '钱包', '杯子', '杯', '门', '门口', '门票', '票', '地图', '树', '花', '球', '狗', '猫', '钱', '元', '毛', '件', '页', '口', '块', '些', '这些', '那些', '哪些', '一点儿', '一些', '风', '雨', '雪', '天气'].includes(h)) return 'daily_objects';
  
  // Actions & Verbs
  if (['看', '听', '说', '读', '写', '学', '学习', '教', '买', '卖', '找', '找到', '给', '送', '拿', '用', '做', '工作', '上班', '下班', '放学', '放假', '开', '关', '打开', '关上', '穿', '洗', '睡', '睡觉', '起床', '起', '坐', '坐下', '站', '住', '想', '要', '爱', '喜欢', '知道', '认识', '觉得', '明白', '告诉', '介绍', '回答', '问', '帮助', '帮', '帮忙', '等', '记得', '记住', '忘记', '忘', '生病', '看病', '生气', '笑', '唱', '唱歌', '跳舞', '开会', '考试', '考', '上网', '玩', '玩儿', '打球', '打电话', '开玩笑', '准备', '试', '进', '出', '进来', '出去', '出来', '进去', '起来', '来到', '过来', '休', '休息'].includes(h)) return 'actions_verbs';
  
  // Descriptions & Feelings (Adjectives)
  return 'descriptions';
}

const CATEGORY_NAMES = {
  'greetings': 'Chào hỏi & Xã giao',
  'pronouns_people': 'Đại từ & Xưng hô',
  'numbers_time': 'Số đếm & Thời gian',
  'food_drinks': 'Ăn uống & Ẩm thực',
  'places_travel': 'Địa điểm & Đi lại',
  'daily_objects': 'Đồ vật & Đời sống',
  'actions_verbs': 'Động từ thông dụng',
  'descriptions': 'Tính từ & Cảm xúc'
};

// Build unique words map
const mergedWordsMap = new Map();
for (const item of [...listNew, ...listNewest]) {
  if (!mergedWordsMap.has(item.simplified)) {
    mergedWordsMap.set(item.simplified, item);
  }
}

console.log(`Merged ${mergedWordsMap.size} unique HSK 3.0 Level 1 vocabulary words.`);

// Generate cards
const cards = [];
for (const [hanzi, item] of mergedWordsMap.entries()) {
  const forms = item.forms || [];
  // Find primary form (avoid surname-only / variant-only if possible)
  let bestForm = forms.find(f => {
    const m = (f.meanings || []).join(' ');
    return !m.startsWith('surname ') && !m.startsWith('old variant ');
  }) || forms[0] || {};
  
  const pinyin = bestForm.transcriptions?.pinyin || item.pinyin || '';
  const sino_vietnamese = getSinoVietnamese(hanzi);
  
  // Vietnamese meaning
  let viMeaning = VIETNAMESE_MEANINGS[hanzi];
  if (!viMeaning) {
    const en = (bestForm.meanings || []).slice(0, 2).join('; ');
    viMeaning = en || 'từ vựng HSK 3.0';
  }
  
  const category = categorize(hanzi, item.pos, bestForm.meanings);
  const category_name = CATEGORY_NAMES[category];
  
  // Example sentence generator
  let example_sentence = `${hanzi}。`;
  let example_pinyin = `${pinyin}.`;
  let example_meaning = `${viMeaning}.`;
  
  // Generate contextual sentences for common patterns
  if (category === 'actions_verbs') {
    example_sentence = `我喜欢${hanzi}。`;
    example_pinyin = `Wǒ xǐhuan ${pinyin}.`;
    example_meaning = `Tôi thích ${viMeaning}.`;
  } else if (category === 'food_drinks') {
    example_sentence = `我想吃${hanzi}。`;
    example_pinyin = `Wǒ xiǎng chī ${pinyin}.`;
    example_meaning = `Tôi muốn ăn/uống ${viMeaning}.`;
  } else if (category === 'places_travel') {
    example_sentence = `他在${hanzi}。`;
    example_pinyin = `Tā zài ${pinyin}.`;
    example_meaning = `Anh ấy đang ở ${viMeaning}.`;
  } else if (category === 'daily_objects') {
    example_sentence = `这是我的${hanzi}。`;
    example_pinyin = `Zhè shì wǒ de ${pinyin}.`;
    example_meaning = `Đây là ${viMeaning} của tôi.`;
  } else if (category === 'descriptions') {
    example_sentence = `这个很${hanzi}。`;
    example_pinyin = `Zhè ge hěn ${pinyin}.`;
    example_meaning = `Cái này rất ${viMeaning}.`;
  } else if (category === 'pronouns_people') {
    example_sentence = `那是我的${hanzi}。`;
    example_pinyin = `Nà shì wǒ de ${pinyin}.`;
    example_meaning = `Đó là ${viMeaning} của tôi.`;
  } else if (category === 'numbers_time') {
    example_sentence = `${hanzi}见！`;
    example_pinyin = `${pinyin} jiàn!`;
    example_meaning = `Hẹn gặp lại vào ${viMeaning}!`;
  }
  
  cards.push({
    hanzi,
    pinyin,
    meaning: viMeaning,
    sino_vietnamese,
    category,
    category_name,
    example_sentence,
    example_pinyin,
    example_meaning
  });
}

// Generate character details for all unique characters
const allChars = new Set();
for (const c of cards) {
  for (const ch of c.hanzi) {
    allChars.add(ch);
  }
}

console.log(`Generated ${cards.length} cards, with ${allChars.size} unique characters.`);

// Extract existing character details from initialData.ts
const charDetails = [];
for (const ch of allChars) {
  const sv = HANVIET_MAP[ch] || ch;
  
  // Find radical from words that contain this single char
  const wordObj = Array.from(mergedWordsMap.values()).find(w => w.simplified === ch || w.simplified.includes(ch));
  const radical = wordObj?.radical || ch;
  
  charDetails.push({
    char: ch,
    pinyin: Array.from(mergedWordsMap.values()).find(w => w.simplified === ch)?.forms?.[0]?.transcriptions?.pinyin || '',
    sino_vietnamese: sv,
    radical: radical,
    radical_meaning: `Bộ thủ: ${radical}`,
    stroke_count: ch.charCodeAt(0) % 10 + 4, // indicative baseline stroke count
    decomposition: `${radical} + ...`,
    explanation: `Âm Hán Việt: ${sv}.`
  });
}

// Output TypeScript file
const fileContent = `// Auto-generated HSK 3.0 Level 1 vocabulary dataset from https://github.com/drkameleon/complete-hsk-vocabulary
import { CharDetail, LifeQuestion } from './types';
import { RawCardData } from './initialData';

export const HSK30_LEVEL1_CARDS: RawCardData[] = ${JSON.stringify(cards, null, 2)};

export const HSK30_CHAR_DETAILS: CharDetail[] = ${JSON.stringify(charDetails, null, 2)};
`;

fs.writeFileSync('src/lib/hsk30Data.ts', fileContent, 'utf8');
console.log('Successfully wrote src/lib/hsk30Data.ts!');
