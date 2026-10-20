import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'

// NutUI 组件样式需在业务样式之前引入，业务主题变量方可覆写
import '@nutui/nutui-react-taro/dist/style.css'
import './app.less'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return children
}
  


export default App
