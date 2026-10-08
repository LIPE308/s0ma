import { apiRequest } from "./api";

// Interface para o modelo de Produto
export interface Produto {
    id?: number | string;
    nome: string;
    preco: number;
    descricao?: string;
    categoria?: string;
    imagemUrl?: string;
    estoque?: number;
    criadoEm?: string;
}

// Service com operações CRUD completas para Produtos
export const produtosService = {
    /**
     * [READ ALL] Retorna a lista de todos os produtos
     */
    async listarTodos(): Promise<Produto[]> {
        return apiRequest<Produto[]>("/produtos", {
            method: "GET",
        });
    },

    /**
     * [READ BY ID] Retorna um produto específico pelo ID
     */
    async buscarPorId(id: number | string): Promise<Produto> {
        return apiRequest<Produto>(`/produtos/${id}`, {
            method: "GET",
        });
    },

    /**
     * [CREATE] Cria um novo produto
     */
    async criar(produto: Omit<Produto, "id">): Promise<Produto> {
        return apiRequest<Produto>("/produtos", {
            method: "POST",
            body: JSON.stringify(produto),
        });
    },

    /**
     * [UPDATE] Atualiza os dados de um produto existente
     */
    async atualizar(id: number | string, produto: Partial<Produto>): Promise<Produto> {
        return apiRequest<Produto>(`/produtos/${id}`, {
            method: "PUT",
            body: JSON.stringify(produto),
        });
    },

    /**
     * [DELETE] Remove um produto pelo ID
     */
    async deletar(id: number | string): Promise<{ success: boolean; message?: string } | void> {
        return apiRequest(`/produtos/${id}`, {
            method: "DELETE",
        });
    },
};

export default produtosService;
