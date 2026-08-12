import { evolutionService } from '../src/services/evolutionService';

describe('EvolutionService Tests', () => {
  it('should format requests with custom apikey header', () => {
    // Access internal client headers
    const client = (evolutionService as any).client;
    expect(client.defaults.headers['apikey']).toBeDefined();
  });
});
