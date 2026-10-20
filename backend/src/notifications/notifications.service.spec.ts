import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFromEmail = process.env.RESEND_FROM_EMAIL;
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }
    if (originalFromEmail === undefined) {
      delete process.env.RESEND_FROM_EMAIL;
    } else {
      process.env.RESEND_FROM_EMAIL = originalFromEmail;
    }
    jest.restoreAllMocks();
  });

  it('reports email as undeliverable when the provider key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = jest.spyOn(globalThis, 'fetch');

    const result = await service.sendOtpEmail(
      'admin@example.com',
      'Admin',
      '123456',
    );

    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('includes the 30-minute expiry and sends through Resend', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.RESEND_FROM_EMAIL = 'notifications@example.com';
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 201 }));

    const result = await service.sendOtpEmail(
      'admin@example.com',
      'Admin',
      '123456',
    );

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
      }),
    );
    const request = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(request).toMatchObject({
      from: 'notifications@example.com',
      to: ['admin@example.com'],
      subject: 'Verify your login',
    });
    expect(request.html).toContain('Expires in 30 minutes.');
  });

  it('reports Resend API rejections as failures', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('{"message":"domain is not verified"}', { status: 403 }),
      );

    const result = await service.sendOtpEmail(
      'admin@example.com',
      'Admin',
      '123456',
    );

    expect(result).toEqual({
      success: false,
      error: '{"message":"domain is not verified"}',
    });
  });
});
