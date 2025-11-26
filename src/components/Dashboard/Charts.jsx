import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { useApp } from '../../context/AppContext'

Chart.register(...registerables)

export default function Charts({ userApprovals }) {
  const monthlyChartRef = useRef(null)
  const siteChartRef = useRef(null)
  const statusChartRef = useRef(null)
  const monthlyChartInstance = useRef(null)
  const siteChartInstance = useRef(null)
  const statusChartInstance = useRef(null)

  useEffect(() => {
    renderMonthlyChart()
    renderSiteChart()
    renderStatusChart()

    return () => {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy()
      if (siteChartInstance.current) siteChartInstance.current.destroy()
      if (statusChartInstance.current) statusChartInstance.current.destroy()
    }
  }, [userApprovals])

  const renderMonthlyChart = () => {
    if (!monthlyChartRef.current) return

    if (monthlyChartInstance.current) {
      monthlyChartInstance.current.destroy()
    }

    const months = []
    const data = []
    const today = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      months.push(`${date.getMonth() + 1}월`)

      const monthApprovals = userApprovals.filter(a => {
        const approvalDate = new Date(a.createdAt)
        return approvalDate.getFullYear() === date.getFullYear() &&
               approvalDate.getMonth() === date.getMonth()
      })

      data.push(monthApprovals.length)
    }

    monthlyChartInstance.current = new Chart(monthlyChartRef.current, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: '결재 수',
          data: data,
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    })
  }

  const renderSiteChart = () => {
    if (!siteChartRef.current) return

    if (siteChartInstance.current) {
      siteChartInstance.current.destroy()
    }

    const siteCounts = {}
    userApprovals.forEach(approval => {
      const siteName = approval.siteName || '미지정'
      siteCounts[siteName] = (siteCounts[siteName] || 0) + 1
    })

    const labels = Object.keys(siteCounts)
    const data = Object.values(siteCounts)

    const colors = [
      'rgba(102, 126, 234, 0.6)',
      'rgba(118, 75, 162, 0.6)',
      'rgba(255, 107, 107, 0.6)',
      'rgba(46, 213, 115, 0.6)',
      'rgba(255, 165, 2, 0.6)',
      'rgba(0, 184, 148, 0.6)',
      'rgba(116, 185, 255, 0.6)',
      'rgba(255, 159, 67, 0.6)'
    ]

    siteChartInstance.current = new Chart(siteChartRef.current, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          }
        }
      }
    })
  }

  const renderStatusChart = () => {
    if (!statusChartRef.current) return

    if (statusChartInstance.current) {
      statusChartInstance.current.destroy()
    }

    const statusCounts = {
      'pending': 0,
      'processing': 0,
      'approved': 0,
      'rejected': 0
    }

    userApprovals.forEach(approval => {
      if (approval.status === 'pending' || approval.status === 'processing') {
        if (approval.status === 'pending') {
          statusCounts.pending++
        } else {
          statusCounts.processing++
        }
      } else if (approval.status === 'approved') {
        statusCounts.approved++
      } else if (approval.status === 'rejected') {
        statusCounts.rejected++
      }
    })

    statusChartInstance.current = new Chart(statusChartRef.current, {
      type: 'bar',
      data: {
        labels: ['대기 중', '진행 중', '승인 완료', '반려'],
        datasets: [{
          label: '결재 수',
          data: [
            statusCounts.pending,
            statusCounts.processing,
            statusCounts.approved,
            statusCounts.rejected
          ],
          backgroundColor: [
            'rgba(255, 165, 2, 0.6)',
            'rgba(116, 185, 255, 0.6)',
            'rgba(46, 213, 115, 0.6)',
            'rgba(255, 107, 107, 0.6)'
          ],
          borderColor: [
            'rgba(255, 165, 2, 1)',
            'rgba(116, 185, 255, 1)',
            'rgba(46, 213, 115, 1)',
            'rgba(255, 107, 107, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    })
  }

  return (
    <>
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>월별 결재 통계</h3>
          <canvas ref={monthlyChartRef} style={{ maxHeight: '300px' }}></canvas>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>현장별 결재 현황</h3>
          <canvas ref={siteChartRef} style={{ maxHeight: '300px' }}></canvas>
        </div>
      </div>

      <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>상태별 통계</h3>
        <canvas ref={statusChartRef} style={{ maxHeight: '300px' }}></canvas>
      </div>
    </>
  )
}

