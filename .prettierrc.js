module.exports = {
  // 코드 끝에 세미콜론(;) 사용 여부
  semi: true,

  // 작은 따옴표('') 사용 여부 (false면 "" 사용)
  singleQuote: true,

  // JSX 내에서 작은 따옴표 사용 여부
  jsxSingleQuote: false,

  // 한 줄의 최대 길이 (모바일 개발은 80~100자 권장)
  printWidth: 200,

  // 들여쓰기 간격 (React Native는 2칸이 관례)
  tabWidth: 2,

  // 탭(Tab) 사용 여부 (공간 절약을 위해 보통 false)
  useTabs: false,

  // 객체 리터럴의 중괄호 양 끝에 공백 삽입 (예: { foo: bar })
  bracketSpacing: true,

  // JSX 태그의 '>'를 새 줄에 만들지 않고 마지막 속성 뒤에 바로 붙임
  bracketSameLine: false,

  // 화살표 함수 매개변수가 하나일 때 괄호 항상 표시
  arrowParens: 'always',

  // 여러 줄 객체/배열 등의 마지막 요소 뒤에 항상 쉼표 추가
  trailingComma: 'all',

  // 운영체제마다 다른 줄바꿈 처리 방식을 LF로 통일 (협업 필수)
  endOfLine: 'lf',

  // 객체 속성명에 따옴표를 꼭 필요한 경우에만 사용
  quoteProps: 'as-needed',
};
