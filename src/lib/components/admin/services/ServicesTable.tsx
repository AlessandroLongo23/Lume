'use client';

import { useState } from 'react';
import { useServicesStore } from '@/lib/stores/services';
import { Service } from '@/lib/types/Service';
import { Table } from '@/lib/components/admin/table/Table';
import { EditServiceModal } from './EditServiceModal';
import { DeleteServiceModal } from './DeleteServiceModal';

interface ServicesTableProps {
  services: Service[];
}

export function ServicesTable({ services }: ServicesTableProps) {
  const isLoading = useServicesStore((s) => s.isLoading);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editedService, setEditedService] = useState<Partial<Service>>({});

  const handleEditClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setSelectedService(service);
    setEditedService(new Service(service));
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setSelectedService(service);
    setShowDelete(true);
  };

  return (
    <>
      <Table
        columns={Service.dataColumns}
        data={services}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl="servizi"
        isLoading={isLoading}
        labelPlural="servizi"
        labelSingular="servizio"
      />
      <EditServiceModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedService={editedService} onEditedServiceChange={setEditedService} selectedService={selectedService} />
      <DeleteServiceModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedService={selectedService} />
    </>
  );
}
