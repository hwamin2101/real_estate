import React from "react";

interface ContractData {
  contractDate: string;
  landlordName: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  address: string;
  pricePerMonth: number;
  startDate: string;
  endDate: string;
  deposit: number;
  applicationFee: number;
  totalCost: number;
  numberOfDays: number;
}

interface Props {
  data: ContractData;
}

const ContractPreview: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-3xl mx-auto my-6 border">
      {/* Tiêu đề hợp đồng */}
      <h1 className="text-3xl font-bold text-center mb-6">
        HỢP ĐỒNG THUÊ CĂN HỘ
      </h1>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Ngày ký: {data.contractDate}
      </p>

      {/* 1. Thông tin các bên */}
      <section className="mb-6">
        <h2 className="font-semibold text-lg mb-2">1. Các bên tham gia</h2>
        <p><b>Bên cho thuê:</b> {data.landlordName}</p>
        <p><b>Bên thuê:</b> {data.tenantName}</p>
        <p><b>Email:</b> {data.tenantEmail}</p>
        <p><b>Điện thoại:</b> {data.tenantPhone}</p>
      </section>

      {/* 2. Thông tin căn hộ */}
      <section className="mb-6">
        <h2 className="font-semibold text-lg mb-2">2. Thông tin căn hộ</h2>
        <p><b>Tên căn hộ:</b> {data.propertyName}</p>
        <p><b>Địa chỉ:</b> {data.address}</p>
        <p><b>Giá thuê:</b> {data.pricePerMonth.toLocaleString()} VND/tháng</p>
      </section>

      {/* 3. Thời gian thuê */}
      <section className="mb-6">
        <h2 className="font-semibold text-lg mb-2">3. Thời hạn thuê</h2>
        <p><b>Bắt đầu:</b> {data.startDate}</p>
        <p><b>Kết thúc:</b> {data.endDate}</p>
        <p><b>Số ngày thuê:</b> {data.numberOfDays} ngày</p>
      </section>

      {/* 4. Chi phí và phương thức thanh toán */}
      <section className="mb-6">
        <h2 className="font-semibold text-lg mb-2">4. Chi phí và thanh toán</h2>
        <p>Tiền thuê: <b>{(data.totalCost - data.deposit - data.applicationFee).toLocaleString()} VND</b></p>
        <p>Đặt cọc: <b>{data.deposit.toLocaleString()} VND</b></p>
        <p>Phí hồ sơ: <b>{data.applicationFee.toLocaleString()} VND</b></p>
        <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-primary-700 to-primary-500 text-white font-semibold text-lg">
          Tổng thanh toán: {data.totalCost.toLocaleString()} VND
        </div>
      </section>

      {/* 5. Quyền và nghĩa vụ */}
<section className="mb-6">
  <h2 className="font-semibold text-lg mb-2">5. Quyền và nghĩa vụ của các bên</h2>
  
  <h3 className="font-medium mt-2 mb-1">5.1. Quyền và nghĩa vụ của bên cho thuê</h3>
  <ul className="list-disc list-inside">
    <li>Cung cấp căn hộ đúng tình trạng và điều kiện sử dụng như đã thỏa thuận.</li>
    <li>Bảo đảm quyền sở hữu hợp pháp và không vi phạm pháp luật về căn hộ cho thuê.</li>
    <li>Có quyền kiểm tra căn hộ, nhưng phải thông báo trước ít nhất 24 giờ và không làm gián đoạn sinh hoạt bình thường của bên thuê.</li>
    <li>Được nhận đầy đủ các khoản thanh toán đúng thời hạn theo hợp đồng.</li>
    <li>Chịu trách nhiệm pháp lý nếu vi phạm các điều khoản của hợp đồng.</li>
  </ul>

  <h3 className="font-medium mt-2 mb-1">5.2. Quyền và nghĩa vụ của bên thuê</h3>
  <ul className="list-disc list-inside">
    <li>Thanh toán đầy đủ, đúng hạn các khoản tiền thuê, đặt cọc, phí hồ sơ như trong hợp đồng.</li>
    <li>Bảo quản căn hộ, tài sản đi kèm, không tự ý thay đổi kết cấu hay sửa chữa lớn mà không được sự đồng ý của bên cho thuê.</li>
    <li>Chịu trách nhiệm về thiệt hại gây ra cho căn hộ do lỗi của bên thuê hoặc người thân/thân nhân sử dụng căn hộ.</li>
    <li>Tuân thủ nội quy, quy định về an ninh, vệ sinh và các quy định pháp luật liên quan đến căn hộ.</li>
    <li>Có quyền yêu cầu bên cho thuê sửa chữa, khắc phục hư hỏng và các quyền lợi hợp pháp khác theo pháp luật.</li>
  </ul>

  <h3 className="font-medium mt-2 mb-1">5.3. Nghĩa vụ chung</h3>
  <ul className="list-disc list-inside">
    <li>Các bên phải tôn trọng lẫn nhau và phối hợp thực hiện hợp đồng.</li>
    <li>Mọi tranh chấp phát sinh phải được giải quyết trước tiên bằng thương lượng. Nếu không giải quyết được, các bên có quyền đưa vụ việc ra tòa án có thẩm quyền.</li>
  </ul>
</section>

{/* 6. Cam kết chung */}
<section className="mb-6">
  <h2 className="font-semibold text-lg mb-2">6. Cam kết</h2>
  <p>
    Hai bên cam kết thực hiện đầy đủ các điều khoản quy định trong hợp đồng. 
    Mọi hành vi vi phạm sẽ chịu trách nhiệm pháp lý theo quy định của pháp luật hiện hành. 
    Hợp đồng này có hiệu lực kể từ ngày ký và được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ một bản.
  </p>
</section>


      {/* Ký tên */}
      <div className="flex justify-between mt-12">
        <div className="text-center">
          <p>Bên cho thuê</p>
          <p>________________</p>
        </div>
        <div className="text-center">
          <p>Bên thuê</p>
          <p>________________</p>
        </div>
      </div>
    </div>
  );
};

export default ContractPreview;
