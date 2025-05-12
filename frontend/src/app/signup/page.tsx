'use client';

import { useState, useEffect } from 'react';
import Layout from '@/app/components/layout';

export default function SignUpPage() {
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('naver.com');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState({ text: '', color: '' });

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMatchMessage, setPasswordMatchMessage] = useState({ text: '', color: '' });
  const [passwordPolicy, setPasswordPolicy] = useState({
    length: false,
    specialChar: false,
    uppercase: false,
    number: false,
  });

  const [name, setName] = useState('');

  const [apartment, setApartment] = useState('');
  const [dong, setDong] = useState('');
  const [ho, setHo] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCheckMessage, setPhoneCheckMessage] = useState({ text: '', color: '' });

  const emailDomains = ['naver.com', 'gmail.com', 'daum.net', 'hanmail.net', '직접 입력'];
  const apartments = ['현대아파트', '삼성아파트', 'LG아파트'];
  const dongs = ['101동', '102동', '103동'];
  const hos = ['101호', '102호', '201호', '202호'];

  const handleEmailCheck = () => {
    setTimeout(() => {
      const isDuplicate = Math.random() > 0.5;
      if (isDuplicate) {
        setEmailCheckMessage({ text: '이미 사용중인 이메일입니다.', color: 'text-red-500' });
      } else {
        setEmailCheckMessage({ text: '사용 가능한 이메일입니다.', color: 'text-green-500' });
      }
    }, 500);
  };

  const handlePhoneCheck = () => {
    setTimeout(() => {
      const isDuplicate = Math.random() > 0.5;
      if (isDuplicate) {
        setPhoneCheckMessage({ text: '이미 등록된 휴대폰 번호입니다.', color: 'text-red-500' });
      } else {
        setPhoneCheckMessage({ text: '사용 가능한 휴대폰 번호입니다.', color: 'text-green-500' });
      }
    }, 500);
  };

  useEffect(() => {
    if (password && passwordConfirm) {
      if (password === passwordConfirm) {
        setPasswordMatchMessage({ text: '비밀번호가 일치합니다.', color: 'text-green-500' });
      } else {
        setPasswordMatchMessage({ text: '비밀번호가 일치하지 않습니다.', color: 'text-red-500' });
      }
    } else {
      setPasswordMatchMessage({ text: '', color: '' });
    }

    setPasswordPolicy({
      length: password.length >= 8,
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[a-zA-Z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [password, passwordConfirm]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullEmail = emailDomain === '직접 입력' ? `${emailId}@${customEmailDomain}` : `${emailId}@${emailDomain}`;
    console.log({
      name,
      email: fullEmail,
      password,
      passwordConfirm,
      address: `${apartment} ${dong} ${ho}`,
      phoneNumber,
    });
  };

  const 정책문구스타일 = "text-xs";
  const 충족스타일 = "text-green-500";
  const 미충족스타일 = "text-red-500";

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center bg-white-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl p-8 space-y-8 bg-white shadow-xl rounded-xl">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              회원가입
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              {/* 이메일 */}
              <div className="mb-6">
                <label htmlFor="email-id" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="email-id"
                    name="email-id"
                    type="text"
                    autoComplete="email-id"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="이메일 아이디"
                    value={emailId}
                    onChange={(e) => {
                      setEmailId(e.target.value);
                      setEmailCheckMessage({ text: '', color: '' });
                    }}
                  />
                  <span className="text-gray-500">@</span>
                  {emailDomain === '직접 입력' ? (
                    <input
                      type="text"
                      required
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="도메인 입력"
                      value={customEmailDomain}
                      onChange={(e) => {
                          setCustomEmailDomain(e.target.value);
                          setEmailCheckMessage({ text: '', color: '' });
                      }}
                    />
                  ) : (
                    <select
                      id="email-domain"
                      name="email-domain"
                      value={emailDomain}
                      onChange={(e) => {
                          setEmailDomain(e.target.value);
                          if (e.target.value !== '직접 입력') setCustomEmailDomain('');
                          setEmailCheckMessage({ text: '', color: '' });
                      }}
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    >
                      {emailDomains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  )}
                  <button type="button" onClick={handleEmailCheck} className="ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap">
                    중복체크
                  </button>
                </div>
                {emailCheckMessage.text && (
                  <p className={`mt-2 text-xs ${emailCheckMessage.color}`}>{emailCheckMessage.text}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">이메일은 로그인 ID로 사용됩니다.</p>
              </div>

              {/* 비밀번호 */}
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* 비밀번호 확인 */}
              <div className="mb-6">
                <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <input
                  id="password-confirm"
                  name="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
                {passwordMatchMessage.text && (
                  <p className={`mt-2 text-xs ${passwordMatchMessage.color}`}>{passwordMatchMessage.text}</p>
                )}
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li className={`${정책문구스타일} ${passwordPolicy.length ? 충족스타일 : 미충족스타일}`}>총 8글자 이상</li>
                  <li className={`${정책문구스타일} ${passwordPolicy.specialChar ? 충족스타일 : 미충족스타일}`}>특수문자 1개 이상</li>
                  <li className={`${정책문구스타일} ${passwordPolicy.uppercase ? 충족스타일 : 미충족스타일}`}>영문자 1개 이상</li>
                  <li className={`${정책문구스타일} ${passwordPolicy.number ? 충족스타일 : 미충족스타일}`}>숫자 1개 이상</li>
                </ul>
              </div>

              {/* 이름 */}
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* 주소 */}
              <div className="mb-6">
                <label htmlFor="address-apartment" className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    id="address-apartment"
                    name="address-apartment"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  >
                    <option value="" disabled>아파트 선택</option>
                    {apartments.map((apt) => (
                      <option key={apt} value={apt}>
                        {apt}
                      </option>
                    ))}
                  </select>
                  <select
                    id="address-dong"
                    name="address-dong"
                    value={dong}
                    onChange={(e) => setDong(e.target.value)}
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  >
                    <option value="" disabled>동 선택</option>
                    {dongs.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    id="address-ho"
                    name="address-ho"
                    value={ho}
                    onChange={(e) => setHo(e.target.value)}
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  >
                    <option value="" disabled>호 선택</option>
                    {hos.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                 <p className="mt-2 text-xs text-gray-500">Enter your address</p>
              </div>

              {/* 휴대폰 번호 */}
              <div className="mb-8">
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                  휴대폰 번호
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="phone-number"
                    name="phone-number"
                    type="tel"
                    autoComplete="tel"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="휴대폰 번호를 입력하세요 (예: 01012345678)"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                      setPhoneCheckMessage({ text: '', color: '' });
                    }}
                  />
                  <button type="button" onClick={handlePhoneCheck} className="ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap">
                    중복체크
                  </button>
                </div>
                {phoneCheckMessage.text && (
                  <p className={`mt-2 text-xs ${phoneCheckMessage.color}`}>{phoneCheckMessage.text}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400"
              >
                회원가입
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">간편 회원가입</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-300"
              >
                카카오톡으로 회원가입
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 