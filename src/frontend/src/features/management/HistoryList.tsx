import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Input, DatePicker, Select, Card, Row, Col, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

// DTO Interface
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dữ liệu giả lập
  const initialData: MedicalReportDTO[] = [
    { id: '1', patientName: 'Nguyễn Văn A', doctorName: 'Dr. Strange', finalRiskLevel: 'High', verifiedAt: '2025-12-27' },
    { id: '2', patientName: 'Trần Thị B', doctorName: 'Dr. House', finalRiskLevel: 'Low', verifiedAt: '2025-12-26' },
    { id: '3', patientName: 'Lê Văn C', doctorName: 'Dr. Who', finalRiskLevel: 'Medium', verifiedAt: '2025-12-25' },
    { id: '4', patientName: 'Phạm Thị D', doctorName: 'Dr. Strange', finalRiskLevel: 'Normal', verifiedAt: '2025-12-24' },
    { id: '5', patientName: 'Hoàng Văn E', doctorName: 'Dr. Watson', finalRiskLevel: 'High', verifiedAt: '2025-12-23' },
  ];

  const [dataSource, setDataSource] = useState<MedicalReportDTO[]>(initialData);

  // Giả lập loading và filter
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = initialData.filter(item => 
        item.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.doctorName.toLowerCase().includes(searchText.toLowerCase())
      );

      if (statusFilter) {
        filtered = filtered.filter(item => item.finalRiskLevel === statusFilter);
      }
      
      setDataSource(filtered);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, statusFilter]);

  const columns = [
    { 
      title: 'Tên Bệnh Nhân', 
      dataIndex: 'patientName', 
      key: 'patientName',
      sorter: (a: MedicalReportDTO, b: MedicalReportDTO) => a.patientName.localeCompare(b.patientName),
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    { 
      title: 'Bác Sĩ Phụ Trách', 
      dataIndex: 'doctorName', 
      key: 'doctorName',
      responsive: ['md'] as any
    },
    { 
      title: 'Đánh Giá Nguy Cơ', 
      dataIndex: 'finalRiskLevel', 
      key: 'risk',
      render: (risk: string) => {
        let color = '';
        let label = '';
        switch (risk) {
            case 'High': color = 'error'; label = 'NGUY CƠ CAO'; break;
            case 'Medium': color = 'warning'; label = 'TRUNG BÌNH'; break;
            case 'Low': color = 'success'; label = 'THẤP'; break;
            case 'Normal': color = 'processing'; label = 'BÌNH THƯỜNG'; break;
            default: color = 'default'; label = risk;
        }
        return <Tag color={color} style={{ minWidth: 100, textAlign: 'center' }}>{label}</Tag>;
      }
    },
    { 
      title: 'Ngày Khám', 
      dataIndex: 'verifiedAt', 
      key: 'verifiedAt',
      sorter: (a: MedicalReportDTO, b: MedicalReportDTO) => dayjs(a.verifiedAt).unix() - dayjs(b.verifiedAt).unix(),
    },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 120,
      render: (_: any, record: MedicalReportDTO) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết hồ sơ">
            <Button 
                type="primary" 
                ghost 
                icon={<EyeOutlined />} 
                size="small" 
                onClick={() => navigate(`/diagnosis/${record.id}`)}
            >
                Chi tiết
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '80vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#1890ff' }}>Lịch Sử Khám Bệnh</h2>
        <Button icon={<ReloadOutlined />} onClick={() => setSearchText('')}>Làm mới</Button>
      </div>

      {/* Khu vực bộ lọc */}
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 8, background: '#f5f5f5' }}>
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
                <Input 
                  placeholder="Tìm tên bệnh nhân / bác sĩ..." 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
            </Col>
            <Col xs={24} sm={8} md={6}>
                <Select 
                    style={{ width: '100%' }} 
                    placeholder="Chọn mức độ nguy cơ"
                    allowClear
                    onChange={(val) => setStatusFilter(val)}
                    suffixIcon={<FilterOutlined />}
                >
                    <Option value="High"><Tag color="error">High</Tag></Option>
                    <Option value="Medium"><Tag color="warning">Medium</Tag></Option>
                    <Option value="Low"><Tag color="success">Low</Tag></Option>
                    <Option value="Normal"><Tag color="processing">Normal</Tag></Option>
                </Select>
            </Col>
            <Col xs={24} sm={8} md={8}>
                <RangePicker style={{ width: '100%' }} placeholder={['Từ ngày', 'Đến ngày']} />
            </Col>
        </Row>
      </Card>

      <Table 
        columns={columns} 
        dataSource={dataSource} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} hồ sơ` }}
      />
    </div>
  );
};

export default HistoryList;