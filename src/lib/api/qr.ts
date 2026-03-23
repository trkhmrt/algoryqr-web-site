import { api } from "./client";

export type QrRequestDetails =
  | {
      url: string;
    }
  | {
      ssid: string;
      password: string;
      security: "WPA" | "WEP" | "NONE";
    }
  | {
      mail: string;
      subject: string;
      body: string;
    }
  | {
      fullName: string;
      phone: string;
      mail: string;
      company: string;
      title: string;
    }
  | {
      text: string;
    }
  | {
      latitude: string;
      longitude: string;
      label: string;
    };

export interface CreateQrRequestBody {
  userId?: number | string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
}

export interface QrResponse {
  id: string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
  imgSrc: string;
  status: "active" | "inactive" | "draft";
  createdAt: string;
  updatedAt: string;
  scans: number;
}

export interface CreateQrResponse {
  qrResponse: QrResponse;
}

export interface UpdateQrRequestBody {
  userId?: number | string;
  qrName: string;
  type: string;
  details: QrRequestDetails;
}

type UpdateQrGatewayResponse = {
  imgSrc: string;
};

export interface UpdateQrNameRequestBody {
  qrName: string;
}

type UpdateQrNameGatewayResponse = {
  qrName?: string;
  id?: number | string;
};

export interface UserQrApiItem {
  qrId: number;
  userId: number;
  qrName: string;
  imgSrc: string;
  details: Record<string, unknown>;
  createdAt: string;
}

type CreateQrGatewayResponse = {
  imgSrc: string;
};

export async function createQrRequest(payload: CreateQrRequestBody): Promise<CreateQrResponse> {
  const requestBody = {
    qrName: payload.qrName,
    type: payload.type,
    details: payload.details,
  };
  const response = await api.post<CreateQrGatewayResponse>("/qr/create", requestBody);
  const now = new Date().toISOString();

  return {
    qrResponse: {
      id: `temp-${Date.now()}`,
      qrName: payload.qrName,
      type: payload.type,
      details: payload.details,
      imgSrc: response.data.imgSrc,
      status: "active",
      createdAt: now,
      updatedAt: now,
      scans: 0,
    },
  };
}

export async function getUserQrsRequest(userId: number | string): Promise<UserQrApiItem[]> {
  const response = await api.get<UserQrApiItem[]>(`/qr/user/${userId}`);
  return response.data;
}

export async function deleteQrRequest(qrId: number | string): Promise<string> {
  const response = await api.delete<string>(`/qr/delete/${qrId}`);
  return response.data;
}

export async function updateQrRequest(
  qrId: number | string,
  payload: UpdateQrRequestBody
): Promise<UpdateQrGatewayResponse> {
  const requestBody = {
    userId: payload.userId,
    qrName: payload.qrName,
    type: payload.type,
    details: payload.details,
  };
  const response = await api.put<UpdateQrGatewayResponse>(`/qr/update/${qrId}`, requestBody);
  return response.data;
}

export async function updateQrNameRequest(
  qrId: number | string,
  payload: UpdateQrNameRequestBody
): Promise<UpdateQrNameGatewayResponse> {
  const response = await api.patch<UpdateQrNameGatewayResponse>(`/qr/update-name/${qrId}`, payload);
  return response.data;
}
