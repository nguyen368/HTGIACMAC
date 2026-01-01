import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card } from 'antd';
import { UserOutlined, FileSearchOutlined } from '@ant-design/icons';
// --- SỬA LỖI TẠI ĐÂY: Thêm từ khóa 'type' ---
import { doctorApi, type PatientQueueItem } from '../../../api/doctorApi';

const PatientQueueTable: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PatientQueueItem[]>([]);

    useEffect(() => {
        const mockDoctorId = "doctor-guid-id"; 
        
        setLoading(true);
        doctorApi.getAssignedPatients(mockDoctorId)
            .then((res) => {
                // @ts-ignore
                setData(res || []); 
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
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
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
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
            />
        </Card>
    );
};

export default PatientQueueTable;