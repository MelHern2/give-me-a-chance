import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Report } from '@/types';

export const createReport = async (report: Omit<Report, 'id' | 'createdAt'> & { createdAt?: Date }): Promise<void> => {
  try {
    await addDoc(collection(db, 'reports'), {
      ...report,
      createdAt: report.createdAt || new Date(),
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

// Obtener reportes con filtros
export const getReports = async (filters?: {
  status?: string;
  type?: string;
  date?: string;
}) => {
  try {
    let reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    
    // Aplicar filtros
    if (filters?.status) {
      reportsQuery = query(reportsQuery, where('status', '==', filters.status));
    }
    
    if (filters?.type) {
      reportsQuery = query(reportsQuery, where('type', '==', filters.type));
    }
    
    const snapshot = await getDocs(reportsQuery);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar por fecha si se especifica
    let filteredReports = reports;
    if (filters?.date) {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filteredReports = reports.filter((report: any) => 
        report.createdAt && new Date(report.createdAt) >= startDate
      );
    }

    // Obtener nombres de usuarios para cada reporte
    const reportsWithNames = await Promise.all(
      filteredReports.map(async (report: any) => {
        const [reporterDoc, reportedDoc] = await Promise.all([
          getDoc(doc(db, 'users', report.reporterId)),
          getDoc(doc(db, 'users', report.reportedUserId))
        ]);

        return {
          ...report,
          reporterName: reporterDoc.exists() ? reporterDoc.data().name : 'Usuario Desconocido',
          reportedUserName: reportedDoc.exists() ? reportedDoc.data().name : 'Usuario Desconocido'
        };
      })
    );

    // Calcular estadísticas
    const now = new Date();
    const stats = {
      total: reports.length,
      pending: reports.filter((r: any) => r.status === 'pending').length,
      resolved: reports.filter((r: any) => r.status === 'resolved').length,
      thisWeek: reports.filter((r: any) => {
        const reportDate = new Date(r.createdAt);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return reportDate >= weekAgo;
      }).length
    };

    return {
      reports: reportsWithNames,
      stats
    };
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
};

// Actualizar estado de un reporte
export const updateReportStatus = async (reportId: string, status: string): Promise<void> => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status,
      updatedAt: new Date(),
      updatedBy: 'admin' // En una implementación real, usar el ID del admin
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

// Obtener un reporte específico
export const getReport = async (reportId: string) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      throw new Error('Reporte no encontrado');
    }
    
    return {
      id: reportDoc.id,
      ...reportDoc.data()
    };
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
}; 