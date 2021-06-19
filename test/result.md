## 4 clusters
  movements
    √ one movements (6ms)
        avg: 5ms        sum: 5ms        count: 1
    √ 100 movements with random socket emit (46ms)
        avg: 27.734375ms        sum: 1775ms     count: 64
    √ 1000 movements with random socket emit (271ms)
        avg: 177.97652582159625ms       sum: 151636ms   count: 852
    √ 3 seconds with all socket emit (3016ms)
        avg: 27.6837376460018ms sum: 30812ms    count: 1113
    sended: 1030


  4 passing (3s)

## 1 cluster
  movements
    √ one movements (7ms)
        avg: 7ms        sum: 7ms        count: 1
    √ 100 movements with random socket emit (96ms)
        avg: 50.18181818181818ms        sum: 2760ms     count: 55
    √ 1000 movements with random socket emit (798ms)
        avg: 463.616ms  sum: 463616ms   count: 1000
    √ 3 seconds with all socket emit (3002ms)
        avg: 6.3431661750245825ms       sum: 6451ms     count: 1017
    sended: 1020

## results
 * 클러스터가 많을 때는 한 순간의 부하에는 강함
 * 클러스터가 하나일 때는 10개의 동시 부하는 빨랐지만 부하가 더 많으면 급격히 낮은 성능을 보임