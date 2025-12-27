import React, { useState } from 'react';
import { Table, Tag, Button, Space, Input, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';

// Mô phỏng DTO từ Backend
interface MedicalReportDTO {
  id: string;
  patientName: string;
  doctorName: string;
  finalRiskLevel: 'High' | 'Medium' | 'Low' | 'Normal';
  verifiedAt: string;
}

const HistoryList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  // Dữ liệu giả lập (Sau này thay bằng API call từ ReportService)
  const initialData: MedicalReportDTO[] = [
    { id: '1', patientName: 'Nguyễn Văn A', doctorName: 'Dr. Strange', finalRiskLevel: 'High', verifiedAt: '2025-12-27' },
    { id: '2', patientName: 'Trần Thị B', doctorName: 'Dr. House', finalRiskLevel: 'Low', verifiedAt: '2025-12-26' },
    { id: '3', patientName: 'Lê Văn C', doctorName: 'Dr. Who', finalRiskLevel: 'Medium', verifiedAt: '2025-12-25' },
    { id: '4', patientName: 'Phạm Thị D', doctorName: 'Dr. Strange', finalRiskLevel: 'Normal', verifiedAt: '2025-12-24' },
  ];

  // Logic lọc tìm kiếm đơn giản
  const filteredData = initialData.filter(item => 
    item.patientName.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'Tên Bệnh Nhân', 
      dataIndex: 'patientName', 
      key: 'patientName',
      sorter: (a: MedicalReportDTO, b: MedicalReportDTO) => a.patientName.localeCompare(b.patientName),
    },
    { title: 'Bác Sĩ', dataIndex: 'doctorName', key: 'doctorName' },
    { 
      title: 'Đánh Giá Nguy Cơ', 
      dataIndex: 'finalRiskLevel', 
      key: 'risk',
      render: (risk: string) => {
        let color = risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green';
        return <Tag color={color} key={risk}>{risk.toUpperCase()}</Tag>;
      }
    },
    { title: 'Ngày Khám', dataIndex: 'verifiedAt', key: 'verifiedAt' },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_: any, record: MedicalReportDTO) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => navigate(`/diagnosis/${record.id}`)}>
            Xem Chi Tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Danh Sách Lịch Sử Khám Bệnh" style={{ margin: 24 }}>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Input 
          placeholder="Tìm kiếm theo tên bệnh nhân..." 
          prefix={<SearchOutlined />} 
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      <Table columns={columns} dataSource={filteredData} rowKey="id" />
    </Card>
  );
};

export default HistoryList;