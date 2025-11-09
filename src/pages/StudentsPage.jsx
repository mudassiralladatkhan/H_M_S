import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import SegmentedControl from '../components/ui/SegmentedControl';
import { Loader, Users, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const StudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [allocatedStudentIds, setAllocatedStudentIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentsResult, allocationsResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, full_name, email, course, contact, created_at')
                    .eq('role', 'Student')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('room_allocations')
                    .select('student_id')
                    .eq('is_active', true)
            ]);

            if (studentsResult.error) throw studentsResult.error;
            if (allocationsResult.error) throw allocationsResult.error;
            
            setStudents(studentsResult.data || []);
            const allocatedIds = new Set(allocationsResult.data.map(a => a.student_id));
            setAllocatedStudentIds(allocatedIds);

        } catch (error) {
            toast.error(`Failed to fetch data: ${error.message}`);
            console.error("Error fetching data:", error);
            setStudents([]);
            setAllocatedStudentIds(new Set());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredStudents = useMemo(() => {
        let filtered = students;

        if (debouncedSearchTerm) {
            const lowercasedTerm = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(student =>
                student.full_name.toLowerCase().includes(lowercasedTerm) ||
                student.email.toLowerCase().includes(lowercasedTerm) ||
                (student.course && student.course.toLowerCase().includes(lowercasedTerm)) ||
                (student.contact && student.contact.includes(lowercasedTerm))
            );
        }

        if (filterStatus === 'allocated') {
            return filtered.filter(student => allocatedStudentIds.has(student.id));
        }
        if (filterStatus === 'unallocated') {
            return filtered.filter(student => !allocatedStudentIds.has(student.id));
        }

        return filtered;
    }, [students, debouncedSearchTerm, filterStatus, allocatedStudentIds]);

    const filterOptions = [
        { label: 'All Students', value: 'all' },
        { label: 'Allocated', value: 'allocated' },
        { label: 'Unallocated', value: 'unallocated' },
    ];

    return (
        <>
            <PageHeader title="Student Management" />

            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content-secondary" />
                    <input
                        type="text"
                        placeholder="Search by name, email, course, or contact..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-base-200 dark:bg-dark-base-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                </div>
                <div className="md:w-auto flex-shrink-0">
                    <SegmentedControl
                        options={filterOptions}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        size="md"
                    />
                </div>
            </div>

            <div className="bg-base-100 dark:bg-dark-base-200 rounded-2xl shadow-lg overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-base-200/50 dark:bg-dark-base-300/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-base-content-secondary dark:text-dark-base-content-secondary uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-base-content-secondary dark:text-dark-base-content-secondary uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-base-content-secondary dark:text-dark-base-content-secondary uppercase tracking-wider">Course</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-base-content-secondary dark:text-dark-base-content-secondary uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        {loading ? (
                            <tbody>
                                <tr><td colSpan="4" className="text-center py-10"><Loader className="mx-auto animate-spin" /></td></tr>
                            </tbody>
                        ) : filteredStudents.length > 0 ? (
                            <motion.tbody
                                className="divide-y divide-base-200 dark:divide-dark-base-300"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {filteredStudents.map((student) => (
                                    <motion.tr
                                        key={student.id}
                                        className="hover:bg-base-200/50 dark:hover:bg-dark-base-300/50 transition-colors"
                                        variants={itemVariants}
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                            <Link to={`/students/${student.id}`} className="text-primary hover:text-primary-focus dark:text-dark-primary dark:hover:text-dark-primary-focus font-semibold">{student.full_name}</Link>
                                            <p className="text-xs text-base-content-secondary dark:text-dark-base-content-secondary">{student.email}</p>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-base-content-secondary dark:text-dark-base-content-secondary">{student.contact}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-base-content-secondary dark:text-dark-base-content-secondary">{student.course}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            {allocatedStudentIds.has(student.id) ? (
                                                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">Allocated</span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400">Unallocated</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan="4">
                                        <EmptyState 
                                            icon={<Users className="w-full h-full" />}
                                            title="No Students Found"
                                            message={searchTerm ? `No students match your search for "${searchTerm}".` : "No students found for the selected filter."}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </>
    );
};

export default StudentsPage;
