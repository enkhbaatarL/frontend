import { EMAIL_FONT_FAMILY } from '@/utils/email'

export const FOOTER_LOGO_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIYAAAAUCAYAAABI10XZAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAACQZJREFUeJztWGtQlNcZpk5+VJuk+ZE6TVqjRpsag5+XGJUqikgE5OJydbnsAuGyosCyLMpl12VRbhYkKyAuEXCTVF2joVsNLUk07kw60aQ2XaNNmCmkte10ura1abat083I9jnyfuHwZXEBQ+lk9sw8s+c97znfeb/zPuc5Z7+AAC+lwWL/GvAw0ABEA38GDMCbwA5gjbdx/vIVLkh6KFANvAicoXo60A/oACcgBy4Dc4AZ0x2zv0xhQYLvA4IAD5AGfApkAdeBZcAQoAJcQDbgAEyAfrpj95cpLCzBQA8dF0ZggClFTee5q0QAO2AFLFTX1Xadd1ab+5T61rON0x2/v0xBQZITgRLADaiJFPraznM9lSbbCjo+RLWQAbf3HXkzy9De64Rfu6vxlKO47th3p/s9vqpF2KBcPy0TI9GXgFrgr0SQW1CD5MqDts9AjnAiDCOGs67rvAYqYYdKWMqbXzVr91sdRTUvl+Ubuq7kVpjv8zUXXnIRYCfMlvjqgTe8jIml/l1jPLOV/Nsm8/4Ydx6onszYuzzzfoqp/B6fowY8QOI4+qbSnN+5lznvFCQ7GWgHPqbfC0j+Sd3Bn7QW1x7rgG0GbEAfVMJU1d7rAGHUUAmXpu64sqDaMqTSHyl6rqzdpdSYHhlH8LX0ogyFEl8va/cyJp8bI0h8CznfrsmsAY09PYlxMhor9+J7iHyWycTEPScQMAJzxtG3gub83hj+RPLH+ZwYCT8NNNGlU1vX/ZZH13JmJ46GG5r6Ew+SSmRAJdxQCVl5c48bKpEHlRjIN3QboRL2zNJWe5q6+eVtOxrM4wj+Y+DXgBN4R+J7bQxibOeSb5b4mjhfKde+inZbFfAk114AZJKfLfhsKTFQLwYMwCyyVwAlQAbwLWpjymcVxwJKSVyjiEHzKlksFFOqpP8sIJy9A7AZmMnNzeJ8nOsbTfGtpr5GUqhymvMpegct2zg0hhHsFfJbxflp3Ba2qYAwnhh9wOvAtfqjF1r0rWeuQwkq8yo7/mY41KuESjir2n+qhUo4oBJG+GxQCRtUogEqMagsMRWlFDQOJarq9LLnqvt9kGI1BVYJtFB9/gSI8QHwL+BBap8J3AR+xRODWwBGwAGqB5OvH/gQcFF7IE8M/O4lu4DsSrJ/T8+7BQQB64Br5GPPO+CDGGzeq8DfOSL/knzfBP5Abe/Q70fA14EcssOo72myfwN8Alwk+9scMd7i5mAIAUIpfg/FzY5ttin+QmvxLvkcIjHYceEBKUxQBKem/nhjnu6FK2nqA0lQCSvazFAJB1SiAioxuKOqOw8q4YZKKNLVze5tO/aXxefuc8ZkGqyRqRV2H8Q4SJMvoIW9Q5IJEEP8FZOWRba4eCIx2A6SSxLUxSWI2VHc88Vdn0b1w9S+gOwaru/7bOGpPu6jhJt3E9mvks3WYQvV88n3DL3DPJ4Y3Hwt1O8BYNALMX5E/jCyT5AtHiUyspPJziR7Lc37KCNGG/CfPW1nTSX1Jzwq3ZFSJNyTVnRgKVTCtavplBIqMVRQ/WICVMKVXdauVpYcdEAlTEmqOhtUwhGl0B3aLN/tCk3QGH0Qgx0flzmb7ZIPJ0CMNcB7bDdxSWK7YJGEGEyWY4RhuWUv+k/gHJegq5Lns7Gislzk2kXimek5DGyH3pokMa5x/njys+Q8SXWmfjpgA9ePJ8Y+qi/k/GYvxHiG8/8JeHsMYiwj+4YwfD/5wecvAFK8u6fttTMlDdbLSPzb6cXPH43L2fs+bJV2/8lBqIQRKmHPregwQSUsII0dKqFlKhGbadgJlfCEJWkNG2RF7rVR+bq7kOJZYbS88RAmQIxsqpfRbyFPDG4X/ZuRAegAPpUQ47Lk+WIcN6nvPGrXUPthjhgiZk2CGA7OH82PpfVhl+9/CCPH08MSYojH3BM+iLGM8/8O+Lk3YnBx/IzeWzyuHwrAPeI4jomu7fpOj6L4+eb4nH2ucPnu1ThS+qASDSDLIFQiGyrhTClszIJK3IZKZEQp9C6oxF6oRH9wTIF9TUSebeWmrJa7EKObJmY7OYQgSnf9BIjxDW7xblECeGKIshzHjZcqhjdi9HI76BK1R5Kdw/VdKtB3BWH4bzTzj7pITpQYwHxajwfIV0S+IgkxYqhuon5zhWEVHi8xRJVKJHshzStesneTPzsAqhC3fU/nSYXG9AlU4FB4StlnIIYMKuHOrexQQCXcUAk5VMIZn1ujg0rYoRLWsKRSS4isaBAq0bhqc87Q8o1K/ZK1Kel3IQZL5nte2n/Lgh8vMchuJ7ubbJ4YYnJ/LAzv7DeIQL6IIV4+i8muJfsjso8Bp6jexiWG2eyf1tF7IIaY8F6K+QrZq4QvXj57hJHLJ3uvP06AGI8LI8cmU9JUsntoXvFyuiQg39A1Q6kxfZCQW3MyIqXsenDMzuM55YdLoRIOqIQppbDJlrS9zgqVMEElHCCNCirhCo4tKA6KyBuCStQsXZ/uXByUvP+JlXEzxyAFu0zZ7zDxi74S8rGLnq8PXIvJDiR7BdmPCdwHLvymk80+XGUCLwn0r4HqHZLnj/rAhfoLwAVK/GNECDuhSjI2Qhj++yclxqgPXDRvJ+cPIn8o2XEUByPyD4URVYqifk9zY8X7EzsaDlAyZwsjH7j4OwiLrZWzmaK+Iq4BjWH/Yl6n9R+5ZyTk1cRGpJZbcCR4VmzMkGXtarsEldCSSsihEq7ItAoFVMINlVBBJZxQCTP6XlqyLsWxaFVi14LlWzd64YS/fImF22DxXBtL6s0pm3R9bEHw06GZN4Ii85JTC5tuQyXksuxqV7RCnw2VGIBKNEAlbEGRqj52l2Aq8VTQtjqohGf+0uhNUxaYv3xehOHvNmdJIa4LwxdFVldM6cTY+blQCSOOFXtsZpUFKmEJSy7tC5GpjVCJAahEBlTCDZXQoK974fKtjXMDI0t9P9lfvsxCysGOYIVAX2KnvEAl4qASCeHyMvZdQgaVcEMllCvDslxQCS1Uoh8qYYVK9M1ZHD7vfxKUv/x/lGeTS2eExKmjoRLJUIlfQCXMS9alWhatTrwIlSicG7hl66PfD7t/uuP0l6kr/wUFv5KTxw6/3AAAAABJRU5ErkJggg=='

export interface FooterProps {
  /** FOOTER 섹션 `fields.footerContent` */
  footerContent?: string
  /** FOOTER_NOTICE 블록 `fields.showLogo` */
  showLogo?: boolean
}

const Footer = ({ footerContent = '', showLogo = true }: FooterProps) => (
  <table width="800" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'collapse', borderTop: '1px solid #000' }}>
    <tbody>
      {footerContent ? (
        <tr>
          <td
            style={{
              padding: '24px 12px 12px 12px',
              color: '#868E96',
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: '20px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {footerContent}
          </td>
        </tr>
      ) : null}
      {showLogo ? (
        <tr>
          <td align="right" style={{ padding: '0 12px 24px 12px' }}>
            <img src={FOOTER_LOGO_BASE64} alt="AI Market Insights" style={{ display: 'block', marginLeft: 'auto', border: 0 }} />
          </td>
        </tr>
      ) : null}
    </tbody>
  </table>
)

export default Footer
