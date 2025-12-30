'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Users,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface Assignment {
  id: string
  startDate: string
  endDate: string | null
  mandatory: boolean
  course: {
    id: string
    title: string
    thumbnail: string | null
  }
  group: {
    id: string
    name: string
    color: string
  } | null
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [currentDate])

  async function fetchAssignments() {
    setLoading(true)
    try {
      const response = await fetch('/api/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(assignment => {
      const startDate = new Date(assignment.startDate)
      const endDate = assignment.endDate ? new Date(assignment.endDate) : startDate
      return date >= startDate && date <= endDate
    })
  }

  const selectedDateAssignments = selectedDate
    ? getAssignmentsForDate(selectedDate)
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendrier</h1>
        <p className="text-muted-foreground">
          Visualisez vos formations planifiées
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Ce jour
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {monthDays.map(day => {
                const dayAssignments = getAssignmentsForDate(day)
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square p-1 rounded-lg transition-colors relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isToday(day)
                        ? 'bg-accent'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <span className="text-sm">{format(day, 'd')}</span>
                    {dayAssignments.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayAssignments.slice(0, 3).map((a, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: a.group?.color || '#3B82F6' }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
                : 'Sélectionnez une date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Chargement...
              </div>
            ) : selectedDateAssignments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune formation ce jour</p>
              </div>
            ) : (
              selectedDateAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-lg border space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{assignment.course.title}</h4>
                    {assignment.mandatory && (
                      <Badge variant="destructive" className="text-xs">
                        Obligatoire
                      </Badge>
                    )}
                  </div>
                  {assignment.group && (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: assignment.group.color,
                        color: assignment.group.color,
                      }}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {assignment.group.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(assignment.startDate), 'HH:mm')}
                    </span>
                    {assignment.endDate && (
                      <span>
                        → {format(new Date(assignment.endDate), 'd MMM', { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Formations à venir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments
              .filter(a => new Date(a.startDate) >= new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 10)
              .map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${assignment.group?.color}20` }}
                  >
                    <BookOpen
                      className="h-6 w-6"
                      style={{ color: assignment.group?.color || '#3B82F6' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{assignment.course.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(assignment.startDate), 'd MMMM yyyy', {
                          locale: fr,
                        })}
                      </span>
                      {assignment.group && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: assignment.group.color,
                            color: assignment.group.color,
                          }}
                        >
                          {assignment.group.name}
                        </Badge>
                      )}
                      {assignment.mandatory && (
                        <Badge variant="destructive" className="text-xs">
                          Obligatoire
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/dashboard/courses/${assignment.course.id}`}>
                      Voir
                    </a>
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
