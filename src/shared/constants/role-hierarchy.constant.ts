export const ROLE_HIERARCHY: Record<string, string[]> = {
  ADMIN: ['SELLER', 'USER'], 
  SELLER: ['USER'],          
  USER: [],                  
}