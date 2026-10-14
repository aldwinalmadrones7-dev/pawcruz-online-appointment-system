/**
 * Profile — For both account types: view and edit personal information (validated), preview
 * a new avatar, and change the password. Veterinarians also edit their public vet profile and
 * schedule here (?tab=schedule opens that tab).
 */
import { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCamera, FiLock, FiMail, FiPhone, FiSave, FiUser } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Avatar from '../../components/Avatar';
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import VetProfileForm from '../../components/VetProfileForm';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { changePassword, updateProfile } from '../../services/authService';
import { ROLE_LABELS, ROLES } from '../../utils/constants';
import { formatIsoDate, getDisplayName, getFullName } from '../../utils/formatters';
import { sanitizePhoneInput, validatePasswordChange, validateProfile } from '../../utils/validators';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

const profileValues = (user) => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email ?? '',
  phone: user.phone ?? '',
  address: user.address ?? '',
});

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const isVet = user.role === ROLES.VET;
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInput = useRef(null);

  const profileForm = useForm(profileValues(user), validateProfile);
  const passwordForm = useForm(EMPTY_PASSWORDS, validatePasswordChange);
  const isDirty = JSON.stringify(profileForm.values) !== JSON.stringify(profileValues(user));

  // Preview only: free the temporary image URL when it is replaced or when leaving the page.
  useEffect(
    () => () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    },
    [avatarUrl],
  );

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Please choose an image smaller than 2 MB.');
      return;
    }
    setAvatarUrl(URL.createObjectURL(file));
    toast.info('Photo preview only — profile photo uploads are not saved yet.');
  };

  const saveProfile = profileForm.handleSubmit(async (values) => {
    try {
      const updated = await updateProfile(values);
      updateUser(updated);
      profileForm.reset(profileValues(updated));
      toast.success('Your profile has been updated.');
    } catch (err) {
      if (!profileForm.applyServerError(err)) toast.error(err.message);
    }
  });

  const savePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await changePassword(values);
      passwordForm.reset();
      toast.success('Password changed. Use your new password next time you log in.');
    } catch (err) {
      if (!passwordForm.applyServerError(err)) toast.error(err.message);
    }
  });

  const { errors } = profileForm;
  const passwordErrors = passwordForm.errors;

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="My profile"
        subtitle={
          isVet
            ? 'Your name, email and mobile number also appear on your public vet profile. Set your duty days and shift under Vet profile & schedule.'
            : 'Keep your contact details up to date so the clinic can reach you about your pets.'
        }
      />
      <Row className="g-4">
        <Col lg={4}>
          <div className="pc-card profile-card">
            <div className="pc-card-body text-center">
              <div className="avatar-edit">
                <Avatar name={getFullName(user)} src={avatarUrl} size={112} />
                <button type="button" className="avatar-camera" onClick={() => fileInput.current?.click()} aria-label="Change profile photo">
                  <FiCamera aria-hidden="true" />
                </button>
                <input ref={fileInput} type="file" accept={AVATAR_TYPES.join(',')} onChange={handleAvatarChange} className="d-none" aria-hidden="true" tabIndex={-1} />
              </div>
              <h2 className="h4 mt-3 mb-0">{getDisplayName(user)}</h2>
              <p className="mb-2">
                {ROLE_LABELS[user.role]} · member since {formatIsoDate(user.createdAt)}
              </p>
              {avatarUrl && <p className="avatar-note">Preview only — not saved yet.</p>}
              <ul className="profile-facts">
                <li>
                  <FiMail aria-hidden="true" /> {user.email}
                </li>
                <li>
                  <FiPhone aria-hidden="true" /> {user.phone}
                </li>
              </ul>
            </div>
          </div>
        </Col>

        <Col lg={8}>
          <div className="pc-card">
            <div className="pc-card-body">
              <Tabs defaultActiveKey={isVet && searchParams.get('tab') === 'schedule' ? 'schedule' : 'info'} id="profile-tabs" className="mb-4" mountOnEnter>
                <Tab
                  eventKey="info"
                  title={
                    <>
                      <FiUser aria-hidden="true" /> Personal info
                    </>
                  }
                >
                  <Form noValidate onSubmit={saveProfile}>
                    <Row className="gx-3">
                      <Col sm={6}>
                        <FormField label="First name" required autoComplete="given-name" error={errors.firstName} {...profileForm.register('firstName')} />
                      </Col>
                      <Col sm={6}>
                        <FormField label="Last name" required autoComplete="family-name" error={errors.lastName} {...profileForm.register('lastName')} />
                      </Col>
                      <Col sm={6}>
                        <FormField label="Email" type="email" required autoComplete="email" error={errors.email} {...profileForm.register('email')} />
                      </Col>
                      <Col sm={6}>
                        <FormField
                          label="Mobile number"
                          type="tel"
                          inputMode="numeric"
                          required
                          placeholder="09XXXXXXXXX"
                          error={errors.phone}
                          {...profileForm.register('phone')}
                          onChange={(event) => profileForm.setFieldValue('phone', sanitizePhoneInput(event.target.value))}
                        />
                      </Col>
                    </Row>
                    <FormField
                      label={isVet ? 'Address' : 'Home address'}
                      as="textarea"
                      rows={2}
                      maxLength={200}
                      placeholder="Street, barangay, city"
                      error={errors.address}
                      {...profileForm.register('address')}
                    />
                    <div className="form-actions">
                      <Button variant="soft" onClick={() => profileForm.reset(profileValues(user))} disabled={!isDirty || profileForm.submitting}>
                        Discard changes
                      </Button>
                      <Button type="submit" variant="brand" disabled={!isDirty || profileForm.submitting}>
                        {profileForm.submitting ? (
                          <>
                            <Spinner animation="border" size="sm" aria-hidden="true" /> Saving…
                          </>
                        ) : (
                          <>
                            <FiSave aria-hidden="true" /> Save changes
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab>

                {isVet && (
                  <Tab
                    eventKey="schedule"
                    title={
                      <>
                        <FaUserMd aria-hidden="true" /> Vet profile &amp; schedule
                      </>
                    }
                  >
                    <VetProfileForm />
                  </Tab>
                )}

                <Tab
                  eventKey="password"
                  title={
                    <>
                      <FiLock aria-hidden="true" /> Change password
                    </>
                  }
                >
                  <Form noValidate onSubmit={savePassword} className="password-form">
                    <FormField label="Current password" controlId="current-password" required error={passwordErrors.currentPassword}>
                      <PasswordInput autoComplete="current-password" {...passwordForm.register('currentPassword')} />
                    </FormField>
                    <FormField label="New password" controlId="new-password" required error={passwordErrors.newPassword}>
                      <PasswordInput autoComplete="new-password" {...passwordForm.register('newPassword')} />
                      <PasswordChecklist password={passwordForm.values.newPassword} />
                    </FormField>
                    <FormField label="Confirm new password" controlId="confirm-new-password" required error={passwordErrors.confirmPassword}>
                      <PasswordInput autoComplete="new-password" {...passwordForm.register('confirmPassword')} />
                    </FormField>
                    <div className="form-actions">
                      <Button type="submit" variant="brand" disabled={passwordForm.submitting}>
                        {passwordForm.submitting ? (
                          <>
                            <Spinner animation="border" size="sm" aria-hidden="true" /> Updating…
                          </>
                        ) : (
                          <>
                            <FiLock aria-hidden="true" /> Update password
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab>
              </Tabs>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
