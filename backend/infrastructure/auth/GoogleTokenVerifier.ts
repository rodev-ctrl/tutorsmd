import { OAuth2Client } from 'google-auth-library';
import { IGoogleTokenVerifier, GooglePayload } from '../../application/ports/IGoogleTokenVerifier';
import { DomainError } from '../../domain/errors/DomainError';

export class GoogleTokenVerifier implements IGoogleTokenVerifier {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<GooglePayload> {
    let ticket;
    try {
      ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
    } catch {
      throw new DomainError('Invalid Google credential');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new DomainError('Invalid Google credential');
    }

    return {
      sub:           payload.sub,
      email:         payload.email,
      emailVerified: payload.email_verified ?? false,
      name:          payload.name ?? null,
      givenName:     payload.given_name ?? null,
      familyName:    payload.family_name ?? null,
      picture:       payload.picture ?? null,
    };
  }
}
