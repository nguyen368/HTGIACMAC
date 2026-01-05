import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, message } from 'antd';
import { UserOutlined, FileSearchOutlined } from '@ant-design/icons';
// Import interface PatientQueueItem để đảm bảo type-safe
import { doctorApi, type PatientQueueItem } from '../../../api/doctorApi';

const PatientQueueTable: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PatientQueueItem[]>([]);

    useEffect(() => {
        // SỬA LỖI 400 (Tiềm ẩn): Backend yêu cầu Guid, chuỗi text thường sẽ gây lỗi
        // Đây là một Guid ngẫu nhiên hợp lệ để test
        const mockDoctorId = "d290f1ee-6c54-4b01-90e6-d701748f0851"; 
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await doctorApi.getAssignedPatients(mockDoctorId);
                // Xử lý an toàn: Nếu API trả về mảng thì dùng luôn, nếu bọc trong data thì lấy data
                // @ts-ignore: Bỏ qua nếu cấu hình axios của bạn trả về data trực tiếp
                const result = Array.isArray(res) ? res : (res?.data || []);
                setData(result);
            } catch (err) {
                console.error("Lỗi khi tải danh sách bệnh nhân:", err);
                // message.error("Không thể kết nối đến máy chủ."); 
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const columns = [
        {
            title: 'Bệnh nhân',
            dataIndex: 'patientName',
            key: 'patientName',
            render: (text: string) => <><UserOutlined /> {text}</>,
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => {
                try {
                    return new Date(date).toLocaleDateString('vi-VN');
                } catch {
                    return date;
                }
            },
        },
        {
            title: 'Cảnh báo AI',
            dataIndex: 'riskLevel',
            key: 'riskLevel',
            render: (level: string) => (
                <Tag color={level === 'High' ? 'red' : 'green'}>
                    {level || 'N/A'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: PatientQueueItem) => (
                <Button type="primary" size="small" icon={<FileSearchOutlined />}>
                    Chẩn đoán
                </Button>
            ),
        },
    ];

    return (
        <Card title="Danh sách chờ khám" bordered={false} style={{ borderRadius: 8 }}>
            <Table 
                columns={columns} 
                dataSource={data} 
                rowKey="reportId" 
                loading={loading}
                pagination={{ pageSize: 5 }} 
                locale={{ emptyText: 'Chưa có bệnh nhân nào' }}
            />
        </Card>
    );
};

export default PatientQueueTable;