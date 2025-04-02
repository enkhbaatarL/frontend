import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'

import fillBetweenPlugin from '@/lib/chart/line/plugins/fillBetweenPlugin'
import intersectionMarkerPlugin from '@/lib/chart/line/plugins/intersectionMarkerPlugin'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const SampleChart = () => {
  const data = {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}일`),
    datasets: [
      {
        label: '데이터1',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 150) + 50),
        borderColor: 'green',
        borderWidth: 2,
        fill: false,
      },
      {
        label: '데이터2',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 30),
        borderColor: 'blue',
        borderWidth: 2,
        fill: false,
      },
      {
        label: '데이터3',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 120) + 40),
        borderColor: 'red',
        borderWidth: 2,
        fill: false,
      },
      {
        label: '데이터4',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 10),
        borderColor: 'gray',
        borderWidth: 2,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '차트 제목',
      },
      tooltip: {
        mode: 'index' as const,
        // 사용 가능한 툴팁 모드:
        // - 'point': 데이터 포인트에 가장 가까운 항목만 표시
        // - 'nearest': 마우스와 가장 가까운 데이터 포인트만 표시
        // - 'index': x축 기준으로 동일한 인덱스의 모든 데이터 표시
        // - 'dataset': 현재 데이터셋의 모든 데이터 포인트 표시
        // - 'x': x축 기준으로 동일한 x값을 가진 모든 데이터 표시
        // - 'y': y축 기준으로 동일한 y값을 가진 모든 데이터 표시
        position: 'nearest' as const, // 툴팁이 마우스 포인터 근처에 표시되도록 설정
        // 사용 가능한 툴팁 포지션:
        // - 'average': 모든 데이터 포인트의 평균 위치에 표시
        // - 'nearest': 마우스 포인터와 가장 가까운 위치에 표시
        // - 'center': 차트의 중앙에 표시
        // - 'top': 차트의 상단에 표시
        // - 'bottom': 차트의 하단에 표시
        // - 'left': 차트의 왼쪽에 표시
        // - 'right': 차트의 오른쪽에 표시
        intersect: false,
      },
      intersectionMarker: {
        labels: ['데이터2', '데이터3'],
      },
      fillBetween: {
        labels: ['데이터1', '데이터4'],
        fillColor: 'rgba(0, 0, 255, 0.2)',
      },
    },
  }

  const plugins = [intersectionMarkerPlugin, fillBetweenPlugin]

  return <Line options={options} data={data} plugins={plugins} />
}

export default SampleChart
