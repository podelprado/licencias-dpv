import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Employee, License, LicenseType, User, AuthResponse, Holiday, Saldo, Absence, PresentismoMes, AuditLog, ImportReport } from '../types';

export const useAppStatus = () =>
  useQuery({
    queryKey: ['appStatus'],
    queryFn: () => apiClient.get<{ activa: boolean; expira: string }>('/admin/status').then((r) => r.data),
    retry: false,
    staleTime: 60_000,
  });

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const useLogin = () =>
  useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  });

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => apiClient.get('/auth/profile').then((r) => r.data) });

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const useEmployees = (search?: string, activo?: boolean) =>
  useQuery({
    queryKey: ['employees', search, activo],
    queryFn: () => {
      const params: any = {};
      if (search) params.search = search;
      if (activo !== undefined) params.activo = activo;
      return apiClient.get<Employee[]>('/employees', { params }).then((r) => r.data);
    },
  });

export const useEmployee = (id: string) =>
  useQuery({
    queryKey: ['employees', id],
    queryFn: () => apiClient.get<Employee>(`/employees/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employee>) => apiClient.post<Employee>('/employees', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      apiClient.put<Employee>(`/employees/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};

// ─── LICENSE TYPES ───────────────────────────────────────────────────────────
export const useLicenseTypes = (onlyActive = false) =>
  useQuery({
    queryKey: ['licenseTypes', onlyActive],
    queryFn: () =>
      apiClient.get<LicenseType[]>('/license-types', { params: onlyActive ? { activo: true } : {} }).then((r) => r.data),
  });

export const useCreateLicenseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LicenseType>) => apiClient.post<LicenseType>('/license-types', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenseTypes'] }),
  });
};

export const useUpdateLicenseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LicenseType> }) =>
      apiClient.put<LicenseType>(`/license-types/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenseTypes'] }),
  });
};

export const useDeleteLicenseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/license-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenseTypes'] }),
  });
};

// ─── LICENSES ────────────────────────────────────────────────────────────────
export const useLicenses = (params?: { empleado?: string; anio?: number; mes?: number; estado?: string }) =>
  useQuery({
    queryKey: ['licenses', params],
    queryFn: () => apiClient.get<License[]>('/licenses', { params }).then((r) => r.data),
  });

export const useLicensesByMonth = (empleadoId: string, anio: number, mes: number) =>
  useQuery({
    queryKey: ['licenses', 'month', empleadoId, anio, mes],
    queryFn: () =>
      apiClient.get<License[]>(`/licenses/employee/${empleadoId}/month/${anio}/${mes}`).then((r) => r.data),
    enabled: !!empleadoId,
  });

export const useLicenseSummary = (empleadoId: string, anio: number) =>
  useQuery({
    queryKey: ['licenses', 'summary', empleadoId, anio],
    queryFn: () => apiClient.get(`/licenses/summary/${empleadoId}/${anio}`).then((r) => r.data),
    enabled: !!empleadoId,
  });

export const useCreateLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<License> & { empleado: string; tipoLicencia: string }) =>
      apiClient.post<License>('/licenses', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenses'] }),
  });
};

export const useUpdateLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<License> }) =>
      apiClient.put<License>(`/licenses/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenses'] }),
  });
};

export const useDeleteLicense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/licenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['licenses'] }),
  });
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: () => apiClient.get<User[]>('/users').then((r) => r.data) });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) =>
      apiClient.post<User>('/users', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { password?: string } }) =>
      apiClient.put<User>(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

// ─── SALDO ───────────────────────────────────────────────────────────────────
export const useSaldo = (empleadoId: string, anio: number, fechaIngreso?: string) =>
  useQuery({
    queryKey: ['saldo', empleadoId, anio],
    queryFn: () =>
      apiClient.get<Saldo>(`/licenses/saldo/${empleadoId}/${anio}`, {
        params: fechaIngreso ? { fechaIngreso } : {},
      }).then((r) => r.data),
    enabled: !!empleadoId,
  });

export const usePresentismo = (empleadoId: string, anio: number) =>
  useQuery({
    queryKey: ['presentismo', empleadoId, anio],
    queryFn: () =>
      apiClient.get<PresentismoMes[]>(`/licenses/presentismo/${empleadoId}/${anio}`).then((r) => r.data),
    enabled: !!empleadoId,
  });

// ─── ABSENCES ────────────────────────────────────────────────────────────────
export const useAbsences = (params?: { empleado?: string; anio?: number; mes?: number }) =>
  useQuery({
    queryKey: ['absences', params],
    queryFn: () => apiClient.get<Absence[]>('/absences', { params }).then((r) => r.data),
  });

export const useCreateAbsence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Absence> & { empleado: string; tipo: string }) =>
      apiClient.post<Absence>('/absences', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['presentismo'] });
    },
  });
};

export const useUpdateAbsence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Absence> }) =>
      apiClient.put<Absence>(`/absences/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['presentismo'] });
    },
  });
};

export const useDeleteAbsence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/absences/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['presentismo'] });
    },
  });
};

// ─── HOLIDAYS ────────────────────────────────────────────────────────────────
export const useHolidays = (anio?: number) =>
  useQuery({
    queryKey: ['holidays', anio],
    queryFn: () =>
      apiClient.get<Holiday[]>('/holidays', { params: anio ? { anio } : {} }).then((r) => r.data),
  });

export const useCreateHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fecha: string; descripcion: string }) =>
      apiClient.post<Holiday>('/holidays', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
};

export const useCreateHolidayBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feriados: { fecha: string; descripcion: string }[]) =>
      apiClient.post('/holidays/bulk', { feriados }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
};

export const useUpdateHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Holiday> }) =>
      apiClient.put<Holiday>(`/holidays/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
};

export const useDeleteHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/holidays/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
};

// ─── EMPLOYEE IMPORT ───────────────────────────────────────────────────────────────
export const useImportEmployees = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post<ImportReport>('/employees/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};

export const useImportReports = () =>
  useQuery({
    queryKey: ['importReports'],
    queryFn: () => apiClient.get<ImportReport[]>('/employees/imports').then((r) => r.data),
  });

export const useImportReport = (id: string) =>
  useQuery({
    queryKey: ['importReport', id],
    queryFn: () => apiClient.get<ImportReport>(`/employees/imports/${id}`).then((r) => r.data),
    enabled: !!id,
  });

// ─── AUDIT ───────────────────────────────────────────────────────────────────
export const useAuditLogs = (params?: { modulo?: string; usuarioId?: string; desde?: string; hasta?: string }) =>
  useQuery({
    queryKey: ['audit', params],
    queryFn: () => apiClient.get<AuditLog[]>('/audit', { params }).then((r) => r.data),
  });
