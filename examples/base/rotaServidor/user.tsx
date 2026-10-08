import { apiRequest } from "./api";

// Interface para o modelo de Usuário
export interface Usuario {
    id?: number | string;
    nome: string;
    email: string;
    senha?: string;
    avatarUrl?: string;
    telefone?: string;
    criadoEm?: string;
}

// Service com operações CRUD completas para Usuários
export const userService = {
    /**
     * [READ ALL] Retorna a lista de todos os usuários
     */
    async listarTodos(): Promise<Usuario[]> {
        return apiRequest<Usuario[]>("/users", {
            method: "GET",
        });
    },

    /**
     * [READ BY ID] Retorna um usuário específico pelo ID
     */
    async buscarPorId(id: number | string): Promise<Usuario> {
        return apiRequest<Usuario>(`/users/${id}`, {
            method: "GET",
        });
    },

    /**
     * [CREATE] Cria um novo usuário
     */
    async criar(usuario: Omit<Usuario, "id">): Promise<Usuario> {
        return apiRequest<Usuario>("/users", {
            method: "POST",
            body: JSON.stringify(usuario),
        });
    },

    /**
     * [UPDATE] Atualiza os dados de um usuário existente
     */
    async atualizar(id: number | string, usuario: Partial<Usuario>): Promise<Usuario> {
        return apiRequest<Usuario>(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(usuario),
        });
    },

    /**
     * [DELETE] Remove um usuário pelo ID
     */
    async deletar(id: number | string): Promise<{ success: boolean; message?: string } | void> {
        return apiRequest(`/users/${id}`, {
            method: "DELETE",
        });
    },
};

export default userService;
